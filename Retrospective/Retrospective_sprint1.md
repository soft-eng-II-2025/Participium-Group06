TEMPLATE FOR RETROSPECTIVE (Team 06)
=====================================

The retrospective should include _at least_ the following
sections:

- [process measures](#process-measures)
- [quality measures](#quality-measures)
- [general assessment](#assessment)

## PROCESS MEASURES 

### Macro statistics

- Number of stories committed vs. done 5/0
- Total points committed vs. done 24/0
- Nr of hours planned vs. spent (as a team) 96h/99h 30min

**Remember** a story is done ONLY if it fits the Definition of Done:
 
- Unit Tests passing
- Code review completed
- Code present on VCS
- End-to-End tests performed

> Please refine your DoD if required (you cannot remove items!) 

### Detailed statistics

| Story  | # Tasks | Points | Hours est. | Hours actual |
|--------|---------|--------|------------|--------------|
| _Uncategorized_   | 15| //|      56.5  |    57.5      |
|  PT-01|      9   |     3  |  13        |       12     |  
| PT-02 | 5        |     3  |    7       |      6,66    |       
| PT-03 | 6        | 2      | 6,5        | 6,83         |
| PT-04 | 4        | 8      | 6,5        | 7,16         |
| PT-05 | 6        | 8      | 8          | 9,33         |

> story `Uncategorized` is for technical tasks, leave out story points (not applicable in this case)

- Hours per task average, standard deviation (estimate and actual)

|            | Mean | StDev |
|------------|------|-------|
| Estimation | 2.17 | 3.08  | 
| Actual     | 2.21 | 3.12  |

- Total estimation error ratio: sum of total hours spent / sum of total hours effort - 1

    $$\frac{\sum_i spent_{task_i}}{\sum_i estimation_{task_i}} - 1 = 0.02$$
    
- Absolute relative task estimation error: sum( abs( spent-task-i / estimation-task-i - 1))/n

    $$\frac{1}{n}\sum_i^n \left| \frac{spent_{task_i}}{estimation_task_i}-1 \right| = 0.24$$
  
## QUALITY MEASURES 

- Unit Testing:
  - Total hours estimated = 4.5
  - Total hours spent = 2
  - Nr of automated unit test cases = 0 
  - Coverage = ?
- E2E testing:
  - Total hours estimated = 2
  - Total hours spent = 2
  - Nr of test cases = 87
  - Coverage = 88
- Code review 
  - Total hours estimated = 5
  - Total hours spent = 7.16
  


## ASSESSMENT

- What did go wrong in the sprint? 
  + We realised that we need two more tasks during the sprints.
  + We encounter some problems so at the end we didn't have time to unit test

- What caused your errors in estimation (if any)?
  + Globally the estimation was good, but some code review were much longer than expected due to bug hard to solve. On the other hand, some code reviews were really short

- What lessons did you learn (both positive and negative) in this sprint?
  + How important code reviews are
  + To make meeting regularly
  + Give more importance to unit tests

- Which improvement goals set in the previous retrospective were you able to achieve? 
  + We splitted better the tasks
  + We had a design meeting at the beginning to decide as a team of the design
  
- Which ones you were not able to achieve? Why?
  + Once again we underestimated time 

- Improvement goals for the next sprint and how to achieve them (technical tasks, team coordination, etc.)

  > Propose one or two
  + Be better with testing, allocate more time to it and spend more time on it too
  + Share the tasks when they are complicated
- One thing you are proud of as a Team!!
  + The team works well together, everyone is reliable !
