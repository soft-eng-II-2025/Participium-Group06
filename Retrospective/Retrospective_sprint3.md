TEMPLATE FOR RETROSPECTIVE (Team ##)
=====================================

The retrospective should include _at least_ the following
sections:

- [process measures](#process-measures)
- [quality measures](#quality-measures)
- [general assessment](#assessment)

## PROCESS MEASURES 

### Macro statistics

- Number of stories committed vs done : 4/4
- Total points committed vs done : 20/20
- Nr of hours planned vs spent (as a team) : 96/93.25

**Remember**  a story is done ONLY if it fits the Definition of Done:
 
- Unit Tests passing
- Code review completed
- Code present on VCS
- End-to-End tests performed

> Please refine your DoD 

### Detailed statistics

| Story  | # Tasks | Points | Hours est. | Hours actual |
|--------|---------|--------|------------|--------------|
|   Uncategorized |     17    |    -   |     49       |     43.25         |
| PT-24      |     9 |     2   |    14        |      15.5        |
| PT-25      |     8 |     8   |    9        |       10       |
| PT-26      |     9 |     5   |      13      |       13.5       |
| PT-27      |     9 |     5   |     11       |         11     |
   

> place technical tasks corresponding to story `#0` and leave out story points (not applicable in this case)

- Hours per task (average, standard deviation): average (planned vs done) : 1.84/1.79; standard deviation (planned vs done) : 2.09/2.12 
- Total task estimation error ratio: sum of total hours estimation / sum of total hours spent -1 = 0.03

  
## QUALITY MEASURES 

- Unit Testing:
  - Total hours estimated: 4
  - Total hours spent: 4
  - Nr of automated unit test cases:  282
  - Coverage (if available): 87%
- Integration testing:
  - Total hours estimated: 7
  - Total hours spent: 7
- E2E testing:
  - Total hours estimated: 3
  - Total hours spent: 3
- Code review: 
  - Total hours estimated: 8 
  - Total hours spent: 9
- Technical Debt management:
  - Strategy adopted: In TD_strategy.md
  - Total hours estimated estimated at sprint planning: 4
  - Total hours spent: 1.5
  


## ASSESSMENT

- What caused your errors in estimation (if any)?
There were not major errors in the estimations.

- What lessons did you learn (both positive and negative) in this sprint?
Doing less stories let us have the time to test properly the application.
While in the other sprints we did only manual UI tests, for this sprint we tried implementing Automated UI tests. But since we started with this approach this sprint, the coverage for the frontend is low.

- Which improvement goals set in the previous retrospective were you able to achieve?
We improved in doing the code reviews. We didn't have any issues in the application after merging feature branches into dev.
We were able to test the server properly, and we added some automated UI tests.
We added a shared postman collection.
  
- Which ones you were not able to achieve? Why?
We didn't documented as expected, beacuse the README has not been updated.

- Improvement goals for the next sprint and how to achieve them (technical tasks, team coordination, etc.)
We need more documentation, adding more comments in the code would help a lot while debugging.


> Propose one or two

- One thing you are proud of as a Team!!
We are proud that we catch up with the tests and we are proud that we implemented all the stories we committed.
