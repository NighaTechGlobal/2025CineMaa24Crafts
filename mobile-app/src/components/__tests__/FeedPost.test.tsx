import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import FeedPost from '../FeedPost';

describe('FeedPost', () => {
  const mockPost = {
    id: 'post-1',
    image: undefined, // FeedPost renders image from base64 `post.image` if present
    caption: 'Test post caption',
    created_at: new Date().toISOString(),
    profiles: {
      first_name: 'John',
      last_name: 'Doe',
      profile_photo_url: 'https://example.com/avatar.jpg',
    },
  };

  it('renders author name and caption', () => {
    const { getByText } = render(<FeedPost post={mockPost} />);
    expect(getByText('John Doe')).toBeTruthy();
    expect(getByText('Test post caption')).toBeTruthy();
  });
});






