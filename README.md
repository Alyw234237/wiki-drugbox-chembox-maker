# Wikipedia Drugbox and Chembox Maker

A [Wikipedia](https://www.wikipedia.org/) template generator and autofiller for [Drugboxes](https://en.wikipedia.org/wiki/Template:Infobox_drug) and [Chemboxes](https://en.wikipedia.org/wiki/Template:Chembox). Use the tool here:

* <https://alyw234237.github.io/wiki-drugbox-chembox-maker/>

Can accept as input [PubChem](https://pubchem.ncbi.nlm.nih.gov/) [compound IDs](https://en.wikipedia.org/wiki/PubChem#Databases) (CIDs), PubChem compound URLs, PubChem-indexed compound names, and PubChem-indexed compound synonyms and other identifiers (e.g., [CAS Registry Number](https://en.wikipedia.org/wiki/CAS_Registry_Number)).

Purely client-side tool (JavaScript) with no server-side component and hence no risk of server-associated downtime (unless GitHub goes down!). Uses the [NCBI PubChem PUG (Power User Gateway) REST API](https://pubchemdocs.ncbi.nlm.nih.gov/pug-rest) followed by the [NLM ChemID*plus* API](https://chem.nlm.nih.gov/api/swagger-ui.html) for retrieving compound data used to fill Drugboxes and Chemboxes. Also fills in [ChemSpider](https://chemspider.com/) IDs with the ChemSpider [InChIToCSID](https://www.chemspider.com/InChI.asmx) tool. Currently a few identifier fields like IUPHAR_ligand, NIAID_ChemDB, and PDB_ligand are not automatically filled.

<!-- Uses [positive lookbehind](https://javascript.info/regexp-lookahead-lookbehind) in JavaScript regular expressions, which is not yet supported in all web browsers. As a result, may not work correctly at this time with [Safari, browsers on iOS, and older browsers](https://caniuse.com/js-regexp-lookbehind). -->
<!-- ^ Fixed/Replaced current two instances -->

See also [Help:Citation tools - English Wikipedia](https://en.wikipedia.org/wiki/Help:Citation_tools) for more tools like this one. The [Diberri Template builder](https://citation-template-filling.toolforge.org/cgi-bin/index.cgi) is a similar but unrelated tool that can be used to generate Chemboxes with PubChem compound IDs and Drugboxes with [DrugBank](https://drugbank.com/) IDs. However, this tool only fills a few fields; PubChem compound IDs cannot be used to generate Drugboxes; compounds with DrugBank IDs are limited mostly to marketed drugs; and Drugbox generation using DrugBank IDs seems to be broken currently (and [has been for a while](https://web.archive.org/web/20200712040837/https://citation-template-filling.toolforge.org/cgi-bin/index.cgi?type=drugbank_id&id=DB00328)). Hence the need for an alternative tool.

To add to left sidebar on Wikipedia for quicker access, see [User:Qwerfjkl/scripts/chemboxmaker](https://en.wikipedia.org/wiki/User:Qwerfjkl/scripts/chemboxmaker).

