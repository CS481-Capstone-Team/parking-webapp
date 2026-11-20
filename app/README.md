# App Requirements

Functional requirements for the Capstone 1 demonstration on December 2, 2026. Small scope: just enough to show the system roughly works.

## Host

| ID | Requirement | Live |
| --- | --- | --- |
| H-01 | **See sensors:** Host sees each sensor's status (online/offline) and battery. | Yes |
| H-02 | **Browse car records:** Host sees recorded cars (sensor, time, direction, speed) in a table they can filter and sort. | No |
| H-03 | **Make a pool:** Host makes a pool with a name and capacity, and adds sensors as in or out. Cannot be saved without at least one in and one out sensor. | No |
| H-04 | **See pool count:** Host sees the pool's real count out of capacity. | Yes |
| H-05 | **Reset pool:** Host can reset the pool's count to 0. | No |
| H-06 | **Share pool:** Host can make the pool visible to Guests. | No |

## Guest

| ID | Requirement | Live |
| --- | --- | --- |
| G-01 | **Search establishment:** Guest searches for an establishment by name and picks it. | No |
| G-02 | **See lots:** Guest sees only that establishment's public pools. | Yes |
| G-03 | **See availability:** Each lot shows its name and open spots out of capacity, kept between 0 and capacity. | Yes |
| G-04 | **See full:** A lot shows "Full" when it has no open spots. | Yes |
