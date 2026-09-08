/**
 * The whole ladder, with what each step costs (V2 slice S4 / value A2).
 *
 * This is the budget-aware part of the product, and the invariant it has to keep
 * is the one people expect us to break: **a budget preference reorders and tags,
 * it never removes.** Every rung is on this list at every budget. Someone with no
 * money still gets to see that Kela-subsidised psychotherapy exists — they are
 * not shown a smaller world because they are poor.
 *
 * The budget control is here as well as in the context questions because the
 * honest thing to do with a reordering is to let the person try it and watch it
 * move, rather than ask once and quietly apply it forever.
 */
import { budgetReordersLadder, orderRungsForBudget, type Budget } from '@reitti/engine';
import { BUDGETS, ladder } from '../config';
import { t } from '../i18n';

export function LadderOverview({
  budget,
  onBudgetChange,
}: {
  budget: Budget;
  onBudgetChange?: (next: Budget) => void;
}) {
  const rungs = orderRungsForBudget(ladder, budget);

  return (
    <section className="ladder-overview">
      <h2 className="ladder-overview-heading">{t('ladder.heading')}</h2>
      <p className="ladder-overview-help">{t('ladder.help')}</p>

      {onBudgetChange && (
        <div className="budget-control">
          <p className="budget-control-label" id="budget-control-label">
            {t('ladder.budgetQuestion')}
          </p>
          <div className="budget-control-options" role="group" aria-labelledby="budget-control-label">
            {BUDGETS.map((option) => (
              <button
                key={option.id}
                type="button"
                className="budget-chip"
                aria-pressed={budget === option.id}
                onClick={() => onBudgetChange(option.id as Budget)}
              >
                {t(option.labelRef)}
              </button>
            ))}
          </div>
          {/* Announced, not just repainted: a reorder that a screen-reader user
              cannot perceive is a change that did not happen for them. */}
          <p className="budget-control-notice" role="status">
            {budgetReordersLadder(budget) ? t('ladder.reorderedFree') : t('ladder.reorderedClinical')}
          </p>
        </div>
      )}

      <ol className="ladder-list" data-budget={budget}>
        {rungs.map((rung) => (
          <li key={rung.id} className="ladder-item" data-rung={rung.id} data-level={rung.level}>
            <div className="ladder-item-head">
              <span className="ladder-item-name">{t(rung.labelRef)}</span>
              <span className="ladder-item-cost">{t(rung.costLabelRef)}</span>
            </div>
            <p className="ladder-item-description">{t(rung.descriptionRef)}</p>
          </li>
        ))}
      </ol>

      <p className="ladder-nothing-hidden">{t('ladder.nothingHidden')}</p>
    </section>
  );
}
