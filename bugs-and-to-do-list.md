# Bugs and To-Do List

* Add support for one or more of these?: ChemSpiderID, IUPHAR_ligand, NIAID_ChemDB, PDB_ligand, and EINECS.
* Automatically apply Wiki formatting (e.g., italics) to IUPAC name.
  * But could conflict with escaping. Would need to be done appropriately.
* DrugBank missing sometimes even though on PubChem (we get it from ChemIDplus and if it's not there then no DrugBank ID even if it's on PubChem).
* Try again message? Sometimes single/brief failure.
* Different synonym handling?

* Finish chembox.
* Can get EINECS from ChemIDplus synonyms list (format: `EINECS 211-517-8`).
* Box type radio doesn't change with back/forward. Change?
* Manual history handling still necessary?
* Test other browsers?
* Remember compound box type selection (localstorage).

