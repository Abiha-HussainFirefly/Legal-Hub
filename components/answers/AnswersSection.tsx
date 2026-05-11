import { useState } from 'react';
import PermissionGate from '../PermissionGate';
import usePermissions from '../../hooks/usePermissions';
import { PERMISSIONS } from '../../utils/permissions';

type AnswerRecord = {
  id: string | number;
  authorName: string;
  body: string;
};

type AnswersSectionProps = {
  answers?: AnswerRecord[];
  discussionAuthorId: string | number | null;
  currentUserId?: string | number | null;
  onCreateAnswer?: (draftAnswer: string) => void;
  onReactAnswer?: (answerId: string | number) => void;
  onAcceptAnswer?: (answerId: string | number) => void;
};

const AnswersSection = ({
  answers = [],
  discussionAuthorId,
  currentUserId = null,
  onCreateAnswer,
  onReactAnswer,
  onAcceptAnswer,
}: AnswersSectionProps) => {
  const { can } = usePermissions();
  const [draftAnswer, setDraftAnswer] = useState('');

  if (!can(PERMISSIONS.ANSWERS_VIEW)) {
    return null;
  }

  const isDiscussionAuthor =
    Boolean(currentUserId) && currentUserId === discussionAuthorId;
  const canAcceptAnswer =
    isDiscussionAuthor &&
    can(PERMISSIONS.ANSWERS_ACCEPT_ON_OWN_DISCUSSION);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Answers</h2>

      <div className="mt-6 space-y-4">
        {answers.map((answer) => (
          <article key={answer.id} className="rounded-xl border border-slate-200 p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-900">{answer.authorName}</p>
                <p className="mt-2 text-sm leading-6 text-slate-700">{answer.body}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                {/* Controls whether the lawyer can react to an answer. */}
                <PermissionGate permission={PERMISSIONS.ANSWERS_REACT}>
                  <button
                    type="button"
                    onClick={() => onReactAnswer?.(answer.id)}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700"
                  >
                    React
                  </button>
                </PermissionGate>

                {/* Controls whether the lawyer can accept an answer on their own discussion. */}
                <PermissionGate permission={PERMISSIONS.ANSWERS_ACCEPT_ON_OWN_DISCUSSION}>
                  {canAcceptAnswer ? (
                    <button
                      type="button"
                      onClick={() => onAcceptAnswer?.(answer.id)}
                      className="rounded-lg border border-emerald-300 px-3 py-2 text-sm text-emerald-700"
                    >
                      Accept
                    </button>
                  ) : null}
                </PermissionGate>
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* Controls whether the lawyer can compose a new answer. */}
      <PermissionGate permission={PERMISSIONS.ANSWERS_CREATE}>
        <div className="mt-6 border-t border-slate-200 pt-6">
          <label htmlFor="answerDraft" className="mb-2 block text-sm font-medium text-slate-700">
            Your answer
          </label>
          <textarea
            id="answerDraft"
            value={draftAnswer}
            onChange={(event) => setDraftAnswer(event.target.value)}
            className="min-h-[120px] w-full rounded-lg border border-slate-300 px-4 py-3 text-sm"
            placeholder="Write your legal answer"
          />
          <button
            type="button"
            onClick={() => onCreateAnswer?.(draftAnswer)}
            className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white"
          >
            Post answer
          </button>
        </div>
      </PermissionGate>
    </section>
  );
};

export default AnswersSection;
