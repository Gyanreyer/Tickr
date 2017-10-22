const loginClient = (()=>{

    //Parse cookies to see if user is logged in
    const cookies = {};
    /*const cookieString = document.cookie;

    if (cookieString !== ''){
        const separatedCookies = cookieString.split('; ');

        for(let i = 0; i < separatedCookies.length; i++){
            const cookieKeyVal = separatedCookies[i].split('=');
            cookies[cookieKeyVal[0]] = cookieKeyVal[1];
        }

        //Set text of account button to match username if user is logged in
        if(cookies.user){
            accountButton.textContent = cookies.user;
        }
    }*/

    const accountButton = document.getElementById('accountButton');
    const accountDropdown = document.getElementById('accountDropdown');

    const loginPage = document.getElementById('loginContainer');
    const loginForm = loginPage.querySelector('#loginForm');
    const usernameField = loginForm.querySelector('#usernameField');
    const passwordField = loginForm.querySelector('#passwordField');
    const loginError = loginPage.querySelector('#loginError');

    const submitLoginButton = loginPage.querySelector('#submitLoginButton');
    const submitCreateButton = loginPage.querySelector('#submitCreateButton');
    const cancelLoginButton = loginPage.querySelector('#cancelLoginButton');

    const favoritesPage = document.getElementById('favoritesContainer');
    const favoritesList = favoritesPage.querySelector('#favorites');

    document.getElementById('logOut').addEventListener('click',()=>{
        cookies.user = '';
        accountButton.textContent = 'Log in';
        accountDropdown.style.height = 0;
    });

    document.getElementById('getFavorites').addEventListener('click',()=>{
        apiCommunicator.sendFavoritesRequest({
            user:cookies.user,
            pass:cookies.pass
        });
    });

    const hideLoginPage = () => {
        loginPage.style.opacity = 0;
        loginPage.style.pointerEvents = 'none';

        loginError.style.height = 0;

        usernameField.value = passwordField.value = '';
    };

    //Show account page if logged in or login page if not
    accountButton.addEventListener('click',()=>{
        if(cookies.user){
            //Retrieve favorites, remove user cookie if account doesn't exist
            if(accountDropdown.clientHeight > 0)
                accountDropdown.style.height = 0;
            else
                accountDropdown.style.height = '4em';
        }
        else{
            loginPage.style.opacity = 1;
            loginPage.style.pointerEvents = 'auto';
        }
    });

    cancelLoginButton.addEventListener('click', hideLoginPage);

    submitLoginButton.addEventListener('click',()=>{
        loginError.style.height = 0;

        apiCommunicator.sendLogin({
            user:usernameField.value,
            pass:passwordField.value
        });
    });

    submitCreateButton.addEventListener('click',()=>{
        loginError.style.height = 0;

        apiCommunicator.createUser({
            user:usernameField.value,
            pass:passwordField.value
        });
    });

    loginPage.addEventListener('click',(e)=>{
        if(e.target !== loginPage) return;

        hideLoginPage();
    });

    favoritesPage.addEventListener('click',(e)=>{
        if(e.target !== favoritesPage) return;

        favoritesPage.style.opacity = 0;
        favoritesPage.style.pointerEvents = 'none';
    });

    return {
        getCookies: ()=>{
            return cookies;
        },
        loginResponse: (code, response)=>{
            if(response.user){
                //Store logged in user cookie (this is maaaaaad insecure but I just need something to work)
                //document.cookie = `user=${response.user}`;
                accountButton.textContent = cookies.user = response.user;
                cookies.pass = response.pass;
                hideLoginPage();
            }
            else{
                loginError.textContent = response.message;
                loginError.style.height = '1em';
            }
        },
        displayFavorites: (code, response)=>{
            if(code !== 200) return;

            while(favoritesList.firstChild)
                favoritesList.removeChild(favoritesList.firstChild);

            const symbols = Object.keys(response);

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

            for(let symbol in response){
                //Create span for symbol
                const symbolSpan = document.createElement('span');
                symbolSpan.className = 'symbol';
                symbolSpan.textContent = symbol;
            
                //Create span for name
                const nameSpan = document.createElement('span');
                nameSpan.className = 'name';
                nameSpan.innerHTML = response[symbol];
                
                const favorite = document.createElement('div');
                favorite.appendChild(symbolSpan);
                favorite.appendChild(nameSpan);

                //Add click event that will load/display data for this div's stock
                favorite.addEventListener('click',()=>{
                    stockClient.buildStockPage({
                        symbol:symbol,
                        name:response[symbol]
                    });
                });

                favoritesList.appendChild(favorite);
            }

            favoritesPage.style.opacity = 1;
            favoritesPage.style.pointerEvents = 'auto';
        },
        updateFavorite:(symbol,add)=>{
            apiCommunicator.updateFavorite({
                symbol,
                add:add.toString(),
                user:cookies.user,
                pass:cookies.pass
            });
        }
    };
})();