TEMPLATE FOR RETROSPECTIVE (Team 06)
=====================================

The retrospective should include _at least_ the following
sections:

- [process measures](#process-measures)
- [quality measures](#quality-measures)
- [general assessment](#assessment)

## PROCESS MEASURES 

### Macro statistics

- Number of stories committed vs. done 5/4
- Total points committed vs. done 30/17
- Nr of hours planned vs. spent (as a team) 96,5/103,8

**Remember** a story is done ONLY if it fits the Definition of Done:
 
- Unit Tests passing
- Code review completed
- Code present on VCS
- End-to-End tests performed

> Please refine your DoD if required (you cannot remove items!) 

### Detailed statistics

| Story  | # Tasks | Points | Hours est. | Hours actual |
|--------|---------|--------|------------|--------------|
| _Uncategorized_   | 17| //|      52,17 |    50,83     |
|  PT-06|      9   |     3  |  10        |       10,7   |  
| PT-07 | 6        |     8  |    7,5     |      7       |       
| PT-08 | 7        | 3      | 8,5        | 12           |
| PT-09 | 7        | 3      | 6,5        |8,08          |
| PT-11 | 10       | 13     | 11,83      | 15,08        |

> story `Uncategorized` is for technical tasks, leave out story points (not applicable in this case)

- Hours per task average, standard deviation (estimate and actual)

|            | Mean | StDev |
|------------|------|-------|
| Estimation | 1,72 | 2,44  | 
| Actual     | 1,85 | 2,56  |

- Total estimation error ratio: sum of total hours spent / sum of total hours effort - 1

    $$\frac{\sum_i spent_{task_i}}{\sum_i estimation_{task_i}} - 1 = 0.075$$
    
- Absolute relative task estimation error: sum( abs( spent-task-i / estimation-task-i - 1))/n

    $$\frac{1}{n}\sum_i^n \left| \frac{spent_{task_i}}{estimation_task_i}-1 \right| = 0.21$$
  
## QUALITY MEASURES 

- Unit Testing:
  - Total hours estimated = 5
  - Total hours spent = 4.83
  - Nr of automated unit test cases = 88 
  - Coverage = 69%
- E2E testing:
  - Total hours estimated = 2
  - Total hours spent = 2
  - Nr of test cases = 45
  - Coverage = 70%
- Code review 
  - Total hours estimated = 3
  - Total hours spent = 2.16
  


## ASSESSMENT

- What did go wrong in the sprint? 
  + We were missing some tasks related to the Docker implementation, probably due to the fact that no one has ever done it.

  + We also did push too many stories in the sprint, therefore we had to work in a hurry in order to complete all of them.

- What caused your errors in estimation (if any)?
  + Linking Docker in general and in particular with story #11
  + We did not expect that the docker deployment would require many additional adjustments to make everything work as without Docker.

- What lessons did you learn (both positive and negative) in this sprint?
  + Docker implies a lot of work that we did not expect.
  + Documentation should be checked each time one of us starts working on a task.
  + Routes should be tested manually before pushing them.
  + Code reviewers should make sure, by doing some testing, that everything works before accepting a pull request.

- Which improvement goals set in the previous retrospective were you able to achieve? 
  + Be better with testing, allocate more time to it and spend more time on it too.
  + Share the tasks when they are complicated.
  
- Which ones you were not able to achieve? Why?
  + //

- Improvement goals for the next sprint and how to achieve them (technical tasks, team coordination, etc.)

  > Propose one or two
  + Code reviewer should be already involved in some way to the story he/she reviews to help them understand what is going on.
  + We need more documentation, adding more comments in the code would help a lot while debugging.
  + We need to define precise procedures to test routes, like using postman and exporting the collection of HTTP requests.

- One thing you are proud of as a Team!!
  + We are proud about being able to implement all the features of the stories and could present all of them during the demo.
