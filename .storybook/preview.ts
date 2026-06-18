import type { Preview } from '@storybook/react';
import { withStoryComments } from '../src/storybook-comment-addon/preview';
import '../src/styles.css';

const preview: Preview = {
  decorators: [withStoryComments],
  parameters: {
    layout: 'fullscreen',
    controls: { expanded: true },
  },
};

export default preview;
