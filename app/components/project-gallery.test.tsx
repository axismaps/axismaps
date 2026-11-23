import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProjectGallery from './project-gallery';

// Mock Next.js Image component
vi.mock('next/image', () => ({
  default: ({ src, alt, className, ...rest }: any) => (
    <img
      src={src}
      alt={alt}
      className={className}
      aria-hidden={rest['aria-hidden']}
    />
  ),
}));

describe('ProjectGallery', () => {
  const images = [
    '/images/projects/demo/01-one.jpg',
    '/images/projects/demo/02-two.jpg',
    '/images/projects/demo/03-three.jpg',
  ];

  const renderGallery = () =>
    render(<ProjectGallery images={images} title="Demo Project" />);

  const slides = () => screen.getAllByRole('img', { hidden: true });

  // Slides mount lazily, so read the position out of the alt text rather than
  // from the index within the rendered set.
  const visibleIndex = () => {
    const visible = slides().find((img) =>
      img.className.includes('opacity-100'),
    );
    const match = visible?.getAttribute('alt')?.match(/screenshot (\d+) of/);
    return match ? Number(match[1]) - 1 : -1;
  };

  it('mounts only the current and next slide initially', () => {
    renderGallery();
    // Mounting every slide up front would defeat the deferral: they all share
    // the visible slide's box, so the browser would fetch them immediately.
    expect(slides()).toHaveLength(2);
  });

  it('mounts further slides as they are reached', async () => {
    const user = userEvent.setup();
    renderGallery();
    await user.click(screen.getByLabelText('Next image'));
    expect(slides()).toHaveLength(3);
  });

  it('shows the first image initially', () => {
    renderGallery();
    expect(visibleIndex()).toBe(0);
    expect(screen.getByText('Image 1 of 3')).toBeInTheDocument();
  });

  it('advances with the next control', async () => {
    const user = userEvent.setup();
    renderGallery();
    await user.click(screen.getByLabelText('Next image'));
    expect(visibleIndex()).toBe(1);
    expect(screen.getByText('Image 2 of 3')).toBeInTheDocument();
  });

  it('wraps backwards from the first image to the last', async () => {
    const user = userEvent.setup();
    renderGallery();
    await user.click(screen.getByLabelText('Previous image'));
    expect(visibleIndex()).toBe(2);
  });

  it('wraps forwards from the last image to the first', async () => {
    const user = userEvent.setup();
    renderGallery();
    await user.click(screen.getByLabelText('Go to image 3'));
    await user.click(screen.getByLabelText('Next image'));
    expect(visibleIndex()).toBe(0);
  });

  it('mounts a distant slide in the same update that selects it', async () => {
    const user = userEvent.setup();
    renderGallery();
    // Slide 3 is unmounted at this point; growing `mounted` after paint would
    // show an empty frame first.
    await user.click(screen.getByLabelText('Go to image 3'));
    expect(visibleIndex()).toBe(2);
    expect(
      slides().some((img) => img.getAttribute('alt')?.includes('3 of 3')),
    ).toBe(true);
  });

  it('jumps to an image via its indicator', async () => {
    const user = userEvent.setup();
    renderGallery();
    await user.click(screen.getByLabelText('Go to image 3'));
    expect(visibleIndex()).toBe(2);
    expect(screen.getByLabelText('Go to image 3')).toHaveAttribute(
      'aria-current',
      'true',
    );
  });

  it('navigates with arrow keys once focused', async () => {
    const user = userEvent.setup();
    renderGallery();
    const carousel = screen.getByRole('group');
    carousel.focus();
    await user.keyboard('{ArrowRight}');
    expect(visibleIndex()).toBe(1);
    await user.keyboard('{ArrowLeft}');
    expect(visibleIndex()).toBe(0);
  });

  it('hides the off-screen images from assistive technology', () => {
    renderGallery();
    const rendered = slides();
    expect(rendered[0]).not.toHaveAttribute('aria-hidden', 'true');
    expect(rendered[1]).toHaveAttribute('aria-hidden', 'true');
  });

  it('stops hidden slides swallowing clicks meant for the visible one', () => {
    renderGallery();
    const rendered = slides();
    expect(rendered[0].className).not.toContain('pointer-events-none');
    expect(rendered[1].className).toContain('pointer-events-none');
  });

  it('renders nothing when given no images', () => {
    const { container } = render(<ProjectGallery images={[]} title="Empty" />);
    expect(container).toBeEmptyDOMElement();
  });

  it('handles a single image without wrapping arithmetic breaking', async () => {
    const user = userEvent.setup();
    render(<ProjectGallery images={[images[0]]} title="Solo" />);
    await user.click(screen.getByLabelText('Next image'));
    expect(screen.getByText('Image 1 of 1')).toBeInTheDocument();
  });

  it('labels the carousel with the project title', () => {
    renderGallery();
    expect(screen.getByRole('group')).toHaveAttribute(
      'aria-label',
      'Demo Project screenshots',
    );
  });

  describe('led by a video', () => {
    const renderWithVideo = () =>
      render(
        <ProjectGallery
          video="https://vimeo.com/123"
          images={images}
          title="Demo Project"
        />,
      );

    const videoFrame = () =>
      screen.getByTitle('Demo Project video') as HTMLIFrameElement;

    // The test environment never loads an iframe's page, so the player has
    // no window of its own: stand one in to catch the messages sent to it.
    const stubPlayer = () => {
      const postMessage = vi.fn();
      Object.defineProperty(videoFrame(), 'contentWindow', {
        value: { postMessage },
      });
      return postMessage;
    };

    // happy-dom reports each iframe it declines to load as a console error.
    beforeEach(() => {
      const original = console.error;
      vi.spyOn(console, 'error').mockImplementation((...args) => {
        if (String(args[0]).includes('Iframe page loading is disabled')) return;
        original(...args);
      });
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('shows the video first, with no screenshot visible', () => {
      renderWithVideo();
      expect(videoFrame()).toHaveAttribute(
        'src',
        'https://player.vimeo.com/video/123?title=0&byline=0&portrait=0',
      );
      expect(screen.getByText('Video, slide 1 of 4')).toBeInTheDocument();
      expect(visibleIndex()).toBe(-1);
    });

    it('moves on to the first screenshot', async () => {
      const user = userEvent.setup();
      renderWithVideo();
      await user.click(screen.getByLabelText('Next slide'));
      expect(visibleIndex()).toBe(0);
      expect(
        screen.getByText('Image 1 of 3, slide 2 of 4'),
      ).toBeInTheDocument();
    });

    it('wraps backwards from the video to the last screenshot', async () => {
      const user = userEvent.setup();
      renderWithVideo();
      await user.click(screen.getByLabelText('Previous slide'));
      expect(visibleIndex()).toBe(2);
    });

    it('pauses the video when it is left', async () => {
      const user = userEvent.setup();
      renderWithVideo();
      const post = stubPlayer();
      await user.click(screen.getByLabelText('Go to image 2'));
      expect(post).toHaveBeenCalledWith(
        '{"method":"pause"}',
        'https://player.vimeo.com',
      );
    });

    it('does not message the video when moving between screenshots', async () => {
      const user = userEvent.setup();
      renderWithVideo();
      await user.click(screen.getByLabelText('Next slide'));
      const post = stubPlayer();
      await user.click(screen.getByLabelText('Next slide'));
      expect(post).not.toHaveBeenCalled();
    });

    it('keeps the hidden video mounted but out of reach', async () => {
      const user = userEvent.setup();
      renderWithVideo();
      await user.click(screen.getByLabelText('Next slide'));
      // Unmounting would lose the viewer's place in the video.
      expect(videoFrame()).toBeInTheDocument();
      expect(videoFrame().parentElement).toHaveAttribute('inert');
      expect(videoFrame().parentElement).toHaveAttribute('aria-hidden', 'true');
    });

    it('lets the video be used while it is showing', () => {
      renderWithVideo();
      expect(videoFrame().parentElement).not.toHaveAttribute('inert');
      expect(videoFrame().parentElement).toHaveAttribute('aria-hidden', 'false');
    });

    it('gives the video its own indicator ahead of the screenshots', () => {
      renderWithVideo();
      expect(screen.getByLabelText('Go to video')).toHaveAttribute(
        'aria-current',
        'true',
      );
      expect(screen.getByLabelText('Go to image 3')).toBeInTheDocument();
      expect(screen.queryByLabelText('Go to image 4')).not.toBeInTheDocument();
    });

    it('labels the carousel as holding both', () => {
      renderWithVideo();
      expect(screen.getByRole('group')).toHaveAttribute(
        'aria-label',
        'Demo Project video and screenshots',
      );
    });

    it('falls back to screenshots alone for a video it cannot embed', () => {
      render(
        <ProjectGallery
          video="https://example.com/clip.mp4"
          images={images}
          title="Demo Project"
        />,
      );
      expect(screen.queryByTitle('Demo Project video')).not.toBeInTheDocument();
      expect(visibleIndex()).toBe(0);
    });
  });
});
