
# EconoCausal — Causal Assumptions

## 1. Target Question
Does receiving a discount offer affect the probability of a customer making a purchase?

## 2. Treatment (T)
Proposed definition:
- 1 = Customer received an offer
- 0 = Customer did not receive an offer

Status: Pending confirmation of the final dataset and treatment definition with the team.

## 3. Outcome (Y)
Proposed outcome: purchase_outcome
- 1 = Purchase occurred
- 0 = No purchase occurred

Status: The outcome window and final definition must be confirmed with the team.

## 4. Target Population
Customers represented in the final, approved project dataset.

## 5. Candidate Pre-treatment Covariates
Potential candidates:
- age_group
- previous_purchases
- purchase_history
- product_category
- campaign_channel

These variables may be used only after confirming their meanings and that they were measured before treatment.

## 6. Identification Assumptions

### Measured Confounding
Relevant common causes of treatment assignment and purchase outcome should be measured and appropriately accounted for.

### Treatment Overlap (Positivity)
Customers with relevant covariate profiles should have a meaningful probability of belonging to either treatment group.

### Consistency
The treatment definition must be clear and sufficiently well-defined for the intended comparison.

### Temporal Ordering
Covariates used as confounders must be measured before treatment. Post-treatment variables must not be included as ordinary pre-treatment confounders.

## 7. Known Limitations
- Observational data may contain unmeasured confounding.
- Passing diagnostic or refutation checks does not prove causality.
- Synthetic data is suitable for prototyping, not for claiming real-world effects.
- Final conclusions depend on the dataset, study design, and assumptions.

## 8. Open Questions
- Which dataset has the team approved?
- Is treatment binary or are multiple discount levels supported?
- What is the purchase outcome window?
- Which candidate covariates are available and measured before treatment?
- What treatment comparison will the DML estimator support?
