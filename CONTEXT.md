# SDA Church Management Platform

A multi-tenant SaaS platform for Seventh-day Adventist churches, starting with financial management for the Fiji Mission and expanding to full church operations.

## Language

**Organization**:
A node in the SDA hierarchy: Local Church, District, Mission, Conference, Union, or General Conference. Each level has distinct financial authority and reporting obligations.
_Avoid_: Entity, unit, branch

**Fund**:
A pool of money with a defined purpose and restriction level. Tithes are sacred (100% flows to Conference/Mission). Offerings split per the Combined Offering Plan. Restricted funds stay local per donor intent.
_Avoid_: Account, category, bucket

**Member**:
A baptized or profession-of-faith Adventist attached to a Local Church. Has a giving record that is privacy-sensitive (treasurer and pastor access only).
_Avoid_: User, person, attendee

**Tithe**:
10% of a member's income, given as sacred trust. The Local Church is custodian only; ownership transfers to the Conference/Mission at the moment of collection. 100% remitted upstream.
_Avoid_: Donation, contribution, income

**Offering**:
Gifts beyond tithe, collected during worship. Split between local church, Conference, Union, and GC world mission according to the Combined Offering Plan (typically 50-60% local, 20% GC, remainder Union/Division).
_Avoid_: Collection, plate offering

**Restricted Fund**:
Money designated by the donor for a specific purpose (building fund, debt retirement, specific mission). Cannot be commingled with general offerings. Stays at the Local Church level.
_Avoid_: Special fund, designated gift

**Remittance**:
The transfer of collected funds from a Local Church to the Mission/Conference. Tithes remit monthly; offerings remit monthly or quarterly per Conference policy.
_Avoid_: Payment, transfer, submission

**Budget**:
A planned allocation of funds for a fiscal period, approved by the Executive Committee (Mission/Conference level) or Church Board (Local Church level). Exists at each organizational tier.
_Avoid_: Plan, projection

**Transaction**:
A financial event: a member's tithe, offering, or special gift. Linked to a Member, Local Church, and Fund. Timestamped with an audit trail.
_Avoid_: Entry, record, line item

**Report**:
A financial statement generated for a specific audience and frequency: monthly remittance reports (church → Mission), quarterly financial statements (Mission → Executive Committee), annual audit reports.
_Avoid_: Summary, export

**Combined Offering Plan**:
The offering allocation formula used by this Mission. All offerings pooled each Sabbath, then split: ~50-60% retained by Local Church, ~20% to GC world mission, remainder to Union/Division. Configurable per Conference.
_Avoid_: Offering split, allocation plan
