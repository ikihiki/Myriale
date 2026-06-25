import { useEffect, useRef, useState, type ReactElement } from 'react';
import { addons } from '@storybook/preview-api';
import type { Decorator } from '@storybook/react';
import { EVENTS, type CommentMode, type StoryComment } from './constants';
import { describeHtmlElement } from './dom';
import './preview.css';

const channel = addons.getChannel();

const applyCommentCounts = (root: HTMLElement, comments: StoryComment[]) => {
  root.querySelectorAll<HTMLElement>('.storybook-comment-has-comment').forEach((target) => {
    target.classList.remove('storybook-comment-has-comment');
    delete target.dataset.commentCount;
  });

  const counts = comments.reduce<Record<string, number>>((acc, comment) => {
    acc[comment.selector] = (acc[comment.selector] || 0) + 1;
    return acc;
  }, {});

  Object.entries(counts).forEach(([selector, count]) => {
    const target = document.querySelector(selector);
    if (!(target instanceof HTMLElement) || !root.contains(target)) return;
    target.classList.add('storybook-comment-has-comment');
    target.dataset.commentCount = `💬 ${count}`;
  });
};

const StoryCommentCanvas = ({ children }: { children: ReactElement }) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<CommentMode>('interactive');
  const [comments, setComments] = useState<StoryComment[]>([]);

  useEffect(() => {
    const handleMode = (nextMode: CommentMode) => setMode(nextMode);
    const handleComments = (nextComments: StoryComment[]) => setComments(nextComments);

    channel.on(EVENTS.MODE_CHANGED, handleMode);
    channel.on(EVENTS.COMMENTS_UPDATED, handleComments);

    return () => {
      channel.off(EVENTS.MODE_CHANGED, handleMode);
      channel.off(EVENTS.COMMENTS_UPDATED, handleComments);
    };
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    applyCommentCounts(root, comments);
  }, [comments]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || mode !== 'select') return;

    const selectFromEvent = (event: Event) => {
      const eventTarget = event.target;
      if (!(eventTarget instanceof HTMLElement)) return;
      if (!root.contains(eventTarget)) return;

      event.preventDefault();
      event.stopPropagation();
      if ('stopImmediatePropagation' in event) event.stopImmediatePropagation();
      channel.emit(EVENTS.TARGET_SELECTED, describeHtmlElement(eventTarget, root));
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      selectFromEvent(event);
    };

    root.addEventListener('click', selectFromEvent, true);
    root.addEventListener('keydown', handleKeyDown, true);

    return () => {
      root.removeEventListener('click', selectFromEvent, true);
      root.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [mode]);

  return (
    <div
      ref={rootRef}
      className="storybook-comment-canvas"
      data-comment-mode={mode}
    >
      {children}
    </div>
  );
};

export const withStoryComments: Decorator = (Story) => (
  <StoryCommentCanvas>
    <Story />
  </StoryCommentCanvas>
);
