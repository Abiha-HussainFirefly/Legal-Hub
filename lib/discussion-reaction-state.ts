export interface DiscussionViewerReaction {
  reactionType: string;
  emoji: string | null;
}

export type EmojiStatsMap = Record<string, { count: number; reactors: string[] }>;

function getScoreValue(reactionType: string | null | undefined) {
  if (reactionType === "UPVOTE") return 1;
  if (reactionType === "DOWNVOTE") return -1;
  return 0;
}

function cloneEmojiStats(emojiStats: EmojiStatsMap): EmojiStatsMap {
  return Object.fromEntries(
    Object.entries(emojiStats).map(([emoji, stat]) => [
      emoji,
      { count: stat.count, reactors: [...stat.reactors] },
    ]),
  );
}

export function applyOptimisticDiscussionReaction(params: {
  score: number;
  reactionCount?: number;
  viewerReaction: DiscussionViewerReaction | null;
  emojiStats: EmojiStatsMap;
  nextReaction: { reactionType: string; emoji?: string };
}) {
  const current = params.viewerReaction;
  const nextEmoji = params.nextReaction.emoji ?? null;
  const nextReaction: DiscussionViewerReaction = {
    reactionType: params.nextReaction.reactionType,
    emoji: nextEmoji,
  };
  const removingCurrent =
    current?.reactionType === nextReaction.reactionType && current?.emoji === nextReaction.emoji;
  const nextViewerReaction = removingCurrent ? null : nextReaction;
  const nextEmojiStats = cloneEmojiStats(params.emojiStats);

  if (current?.emoji) {
    const currentEntry = nextEmojiStats[current.emoji];
    if (currentEntry) {
      const nextCount = currentEntry.count - 1;
      if (nextCount > 0) {
        nextEmojiStats[current.emoji] = { ...currentEntry, count: nextCount };
      } else {
        delete nextEmojiStats[current.emoji];
      }
    }
  }

  if (nextViewerReaction?.emoji) {
    const nextEntry = nextEmojiStats[nextViewerReaction.emoji] ?? { count: 0, reactors: [] };
    nextEmojiStats[nextViewerReaction.emoji] = {
      ...nextEntry,
      count: nextEntry.count + 1,
    };
  }

  const nextScore =
    params.score +
    getScoreValue(nextViewerReaction?.reactionType) -
    getScoreValue(current?.reactionType);

  const currentReactionCount =
    params.reactionCount ??
    Object.values(params.emojiStats).reduce((total, stat) => total + stat.count, 0) +
    (current?.emoji ? 0 : current ? 1 : 0);
  const nextReactionCount = Math.max(
    0,
    currentReactionCount + (nextViewerReaction ? 1 : 0) - (current ? 1 : 0),
  );

  return {
    score: nextScore,
    reactionCount: nextReactionCount,
    viewerReaction: nextViewerReaction,
    emojiStats: nextEmojiStats,
  };
}
