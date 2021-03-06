# jira-addon

To use the addon to display a burnup line on the CFD:
1. Go to chrome://extensions/
2. Put "Developer Mode" slider on the top right into enabled mode
3. Click Load Unpacked on the top left
4. Browse to the git folder, select 0.0.19_1 folder
5. Check the CFD graph 


# CSS Style for Jira Sprint Board

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
9. Click Save

NOTE: There should not be any slashes (\\) in the url. 


If you wish to condense the board even more, you can uncomment the last lines of the style. This will make the columns change size depending on the number of items in them.
```
/*
#jira.ghx-sprint-support .ghx-columns {
	table-layout: auto;
}*/
```

You can change the width of the cards to match your monitor by changing this line:
```    width: 110px !important;```

After making any changes, click Save and the style is immediately applied to the board
