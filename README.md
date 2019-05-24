# jira-addon

To use the style with Stylish:
1. Download Stylish addon
   - for Chrome: https://chrome.google.com/webstore/detail/stylish-custom-themes-for/fjnbnpbmkenffdnngjfgmeleoegfcffe
   - for Firefox: https://addons.mozilla.org/en-US/firefox/addon/stylish/?src=search

2. Click Stylish toolbar button
3. Click the menu button (...)
4. Click Create New Style
5. Give the style a name (like "Jira Board Condensed")
6. Copy the contents of Stylish.css in this repo and paste them into the Code section of Stylish
7. Next to Applies to: on the bottom of the Stylish style page, click Specify, then change the dropdown to URLs matching the regexp
8. Paste this into the text box next to Applies to: .\*.atlassian.net/secure/RapidBoard.jspa.\*

NOTE: There should not be any slashes (\\) in the url. 


This style assumes you have the 5 columns: To do, In progress, PR, QA, Done. If yours are different, you need to change the style to match that (or msg me). The lines defining the columns start with
```
#jira.ghx-sprint-support .ghx-column:nth-child(1):before {
    content: "To do";
}
```
If you do not wish to deal with that at all, you can revert the headers by deleting everything after this line:
```
/* Hides top column headers (since they'll be inside swimlanes) */
```

If you wish to condense the board even more, you can uncomment the last lines of the style. This will make the columns change size depending on the number of items in them.
```
/*
#jira.ghx-sprint-support .ghx-columns {
	table-layout: auto;
}*/
```
