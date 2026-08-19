import { useFinance } from "../../state/FinanceContext.jsx";
import { periodLabel } from "../../utils/date.js";
import { SelectField } from "../SelectField.jsx";

export function PageHeader() {
  const { state, setState, periods, currentView } = useFinance();
  return (
    <>
        <header className="hero">
          <div>
            <p className="eyebrow">{currentView.eyebrow}</p>
            <h2>{currentView.title}</h2>
            <p className="hero-copy">{currentView.description}</p>
          </div>

          <div className="hero-controls">
            <label>
              Periodo
              <SelectField
                value={state.selectedPeriod}
                onValueChange={(selectedPeriod) =>
                  setState((current) => ({ ...current, selectedPeriod }))
                }
                options={periods.map((item) => ({ value: item, label: periodLabel(item) }))}
                ariaLabel="Periodo"
              />
            </label>
          </div>
        </header>
    </>
  );
}
