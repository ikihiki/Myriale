import { useEffect, useRef, useState, type ReactElement } from 'react';
import { addons } from '@storybook/preview-api';
import type { Decorator } from '@storybook/react';
import { EVENTS, type CommentMode, type StoryComment } from './constants';
import { describeHtmlElement } from './dom';
import './preview.css';

const channel = addons.getChannel();

const applyCommentCounts = (root: HTMLElement, comments: StoryComment[]) => {
  const counts = comments.reduce<Record<string, number>>((acc, comment) => {
    acc[comment.id] = (acc[comment.id] || 0) + 1;
    return acc;
  }, {});

  root.querySelectorAll<HTMLElement>('[data-comment-id]').forEach((target) => {
    const count = counts[target.dataset.commentId || ''] || 0;
    target.classList.toggle('storybook-comment-has-comment', count > 0);
    if (count > 0) {
      target.dataset.commentCount = `💬 ${count}`;
    } else {
      delete target.dataset.commentCount;
    }
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
      const commentTarget = eventTarget.closest<HTMLElement>('[data-comment-id]');
      if (!commentTarget || !root.contains(commentTarget)) return;

      event.preventDefault();
      event.stopPropagation();
      if ('stopImmediatePropagation' in event) event.stopImmediatePropagation();
      channel.emit(EVENTS.TARGET_SELECTED, describeHtmlElement(eventTarget, commentTarget));
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
    <div ref={rootRef} className="storybook-comment-canvas" data-comment-mode={mode}>
      {children}
    </div>
  );
};

export const withStoryComments: Decorator = (Story) => (
  <StoryCommentCanvas>
    <Story />
  </StoryCommentCanvas>
);
