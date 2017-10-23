//Module for handling user/login tasks in client
const loginClient = (()=>{

    //Parse cookies to see if user is logged in
    const cookies = {};

    //Elements we'll frequently use
    const accountButton = document.getElementById('accountButton');
    const accountDropdown = document.getElementById('accountDropdown');
    const loginPage = document.getElementById('loginContainer');
    const usernameField = loginPage.querySelector('#usernameField');
    const passwordField = loginPage.querySelector('#passwordField');
    const loginError = loginPage.querySelector('#loginError');
    const favoritesPage = document.getElementById('favoritesContainer');

    //Hide the account dropdown menu
    const hideAccountDropdown = ()=>{
        if(accountDropdown.clientHeight > 0)
            accountDropdown.style.height = 0;
    };

    //Hide the login error message
    const hideLoginError = ()=>{
        if(loginError.clientHeight > 0)
            loginError.style.height = 0;
    };

    //Hide the login page
    const hideLoginPage = () => {
        loginPage.style.opacity = 0;
        loginPage.style.pointerEvents = 'none';

        usernameField.value = passwordField.value = '';

        hideLoginError();
    };

    //Hide favorites page
    const hideFavoritesPage = ()=>{
        favoritesPage.style.opacity = 0;
        favoritesPage.style.pointerEvents = 'none';
    };

    //Clear cookies/stored username and pass
    const clearCookies = ()=>{ 
        document.cookie = 'user=;expires=Thu, 01 Jan 1970 00:00:00 GMT;';
        document.cookie = 'pass=;expires=Thu, 01 Jan 1970 00:00:00 GMT;';
        cookies.user = null;
        cookies.pass = null;
    };

    //Log out of current account
    document.getElementById('logOut').addEventListener('click',()=>{
        clearCookies();

        //Account button will function as login button
        accountButton.textContent = 'Log in';
        hideAccountDropdown();

        //Remove classes from favorite button b/c shouldnt' be selected or interactible
        document.getElementById('favoriteButton').removeAttribute('class');
    });

    //Get and display list of user's stored favorites
    document.getElementById('getFavorites').addEventListener('click',()=>{
        apiCommunicator.sendFavoritesRequest({
            user:cookies.user,
            pass:cookies.pass
        });
    });

    //Show account page if logged in or login page if not
    accountButton.addEventListener('click',()=>{
        //If logged in, show or hide dropdown
        if(cookies.user){
            if(accountDropdown.clientHeight === 0)
                accountDropdown.style.height = '4em';
            else
                hideAccountDropdown();
        }
        //If not logged in, show login page
        else{
            loginPage.style.opacity = 1;
            loginPage.style.pointerEvents = 'auto';

        }
    });

    //Hide account dropdown if user clicks off of it
    document.addEventListener('click',(e)=>{
        if(e.target.parentElement.id !== 'accountDropdown'){
            hideAccountDropdown();
        }
    });

    //Hide login page if user clicks cancel
    loginPage.querySelector('#cancelLoginButton').addEventListener('click', hideLoginPage);

    //Submit login from form
    loginPage.querySelector('#submitLoginButton').addEventListener('click',()=>{
        hideLoginError();

        //This is so insecure oh god
        apiCommunicator.sendLogin({
            user:usernameField.value,
            pass:passwordField.value
        });
    });

    //Post new user w/ given username and password
    loginPage.querySelector('#submitCreateButton').addEventListener('click',()=>{
        hideLoginError();

        apiCommunicator.createUser({
            user:usernameField.value,
            pass:passwordField.value
        });
    });

    //Hide login page if user clicks off
    loginPage.addEventListener('click',(e)=>{
        if(e.target !== loginPage) return;

        hideLoginPage();
    });

    //Hide favorites page if user clicks off
    favoritesPage.addEventListener('click',(e)=>{
        if(e.target !== favoritesPage) return;

        hideFavoritesPage();
    });

    //Public methods for module
    return {
        //Get username/password cookies
        getCookies: ()=>{
            return cookies;
        },
        //Handle response from login attempt
        loginResponse: (code, response)=>{
            if(response.user){
                //Store user info in cookie for future automatic login (this whole system is maaaaaad insecure but I just need something to work)
                document.cookie = `user=${response.user}`;
                document.cookie = `pass=${response.pass}`;
                cookies.user = response.user;
                cookies.pass = response.pass;

                accountButton.textContent = cookies.user;//Display username in account button

                //Add caret to help indicate that account button is clickable
                const caret = document.createElement('span');    
                caret.id = 'caret';
                caret.innerHTML = '&#9660;';
                accountButton.appendChild(caret);

                hideLoginPage();

                //Make favorite button interactible
                document.getElementById('favoriteButton').classList.add('loggedIn');
                //Refresh stock page to display stock with favorite status from account
                stockClient.refreshPage();
            }
            //If login failed, clear cookies and display error message
            else{
                clearCookies();

                if(loginPage.style.opacity != 0){
                    loginError.textContent = response.message;
                    loginError.style.height = '1em';
                }
            }
        },
        //Handle received favorites list
        displayFavorites: (code, response)=>{
            if(code !== 200) return;//Return if error occurred

            //List element to display favorites in
            const favoritesList = favoritesPage.querySelector('#favorites');

            //Clear favorites list
            while(favoritesList.firstChild)
                favoritesList.removeChild(favoritesList.firstChild);

            //Response format is properties of symbol:name
            const symbols = Object.keys(response);//Get all keys/symbols from response

            //If no favorites, display no results
            if(symbols.length === 0){
                //Create span for message
                const message = document.createElement('span');
                message.className = 'symbol';
                message.textContent = 'No results';
            
                //Create div to add to results
                const favorite = document.createElement('div');
                favorite.appendChild(message);

                favoritesList.appendChild(favorite);
            }
            //Otherwise, loop through all symbols and display them
            else{
                for(let symbol in response){
                    //Create span for symbol
                    const symbolSpan = document.createElement('span');
                    symbolSpan.className = 'symbol';
                    symbolSpan.textContent = symbol;
                
                    //Create span for name
                    const nameSpan = document.createElement('span');
                    nameSpan.className = 'name';
                    nameSpan.innerHTML = response[symbol];
                    
                    //Create div for list entry
                    const favorite = document.createElement('div');
                    favorite.className = 'favoriteLink';
                    favorite.appendChild(symbolSpan);
                    favorite.appendChild(nameSpan);

                    //Add click event that will load/display data for this div's stock
                    favorite.addEventListener('click',()=>{
                        stockClient.buildStockPage({
                            symbol:symbol,
                            name:response[symbol]
                        });
                        hideFavoritesPage();
                    });

                    favoritesList.appendChild(favorite);
                }
            }

            //Show favorites page
            favoritesPage.style.opacity = 1;
            favoritesPage.style.pointerEvents = 'auto';
        }
    };
})();

//Check cookies and use them to attempt to log in
if (document.cookie){
    const separatedCookies = document.cookie.split('; ');//Get all cookies

    const cookies = {};//Object to store cookies in

    //Loop through key/val pairs and add them to cookies object
    for(let i = 0; i < separatedCookies.length; i++){
        const cookieKeyVal = separatedCookies[i].split('=');
        cookies[cookieKeyVal[0]] = cookieKeyVal[1];
    }

    apiCommunicator.sendLogin(cookies);//Attempt to login in with user and pass
}