# Policy is versioned data scoped to the unit tree

Church policy — the fund chart, offering calendar, remittance percentages, and reporting schedule — is stored as versioned data with effective dates, not hard-coded. Policy is scoped to the unit tree with inheritance and overrides: the General Conference (or a division) defines defaults, and each lower unit inherits them and may override within bounds (e.g. a mission sets its own offering calendar but cannot invent a fund outside the chart).

We chose this because policy varies by level and changes over time; hard-coding would make every policy change a code release and could not represent legitimate per-unit variation. The override mechanism is the same generic tree the org model already uses.

Consequence: override resolution must be well-defined (nearest ancestor wins), and the system must retain policy history so an audit can establish which policy version a unit operated under in a given period.
