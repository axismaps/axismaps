import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PhotoGallery from './PhotoGallery';

const photos = ['/images/one.jpg', '/images/two.jpg', '/images/three.jpg'];

describe('PhotoGallery', () => {
  it('leads with the first photograph', () => {
    render(<PhotoGallery photos={photos} label="Manhattan — Letterpress" />);

    const lead = screen.getByAltText('Manhattan — Letterpress — photograph 1 of 3');
    expect(lead).toHaveAttribute('src', '/images/one.jpg');
  });

  it('offers a thumbnail per photograph, with the current one marked', () => {
    render(<PhotoGallery photos={photos} label="Manhattan" />);

    const thumbs = screen.getAllByRole('button');
    expect(thumbs).toHaveLength(3);
    expect(thumbs[0]).toHaveAttribute('aria-current', 'true');
    expect(thumbs[1]).toHaveAttribute('aria-current', 'false');
  });

  it('swaps the lead image when a thumbnail is chosen', async () => {
    const user = userEvent.setup();
    render(<PhotoGallery photos={photos} label="Manhattan" />);

    await user.click(screen.getByRole('button', { name: 'Show photograph 3 of 3' }));

    expect(screen.getByAltText('Manhattan — photograph 3 of 3')).toHaveAttribute(
      'src',
      '/images/three.jpg',
    );
    expect(
      screen.getByRole('button', { name: 'Show photograph 3 of 3' }),
    ).toHaveAttribute('aria-current', 'true');
  });

  it('hides the thumbnail strip when there is only one photograph', () => {
    render(<PhotoGallery photos={['/images/only.jpg']} label="Manhattan" />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.getByAltText('Manhattan — photograph 1 of 1')).toBeInTheDocument();
  });

  it('renders nothing when there are no photographs', () => {
    const { container } = render(<PhotoGallery photos={[]} label="Manhattan" />);
    expect(container).toBeEmptyDOMElement();
  });
});
