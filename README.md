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
