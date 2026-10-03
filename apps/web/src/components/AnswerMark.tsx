/**
 * The mark at the left of an answer card: an empty circle, and when the answer
 * is chosen, a filled one with a check mark that draws itself in.
 *
 * Decoration only. Which answer is chosen is carried by `aria-pressed` on the
 * card itself, so this is hidden from assistive tech. The tick finishes inside
 * the moment the chosen answer is held before the next question (answerHold),
 * so it is seen being drawn, not cut off. With reduced motion it appears whole.
 */
export function AnswerMark() {
  return (
    <span className="option-mark" aria-hidden="true">
      <svg viewBox="0 0 18 18" width="18" height="18" focusable="false">
        <path d="M4.6 9.4l2.9 2.9 5.9-6.4" />
      </svg>
    </span>
  );
}
