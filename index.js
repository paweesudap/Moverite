const express = require('express');
const path = require('path');
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');
const dbConnection = require('./database');
const { body, validationResult } = require('express-validator');

const app = express();
app.use(express.urlencoded({extended:false}));

// SET OUR VIEWS AND VIEW ENGINE
app.set('views', path.join(__dirname,'views'));
app.set('view engine','ejs');

// APPLY COOKIE SESSION MIDDLEWARE
app.use(cookieSession({
    name: 'session',
    keys: ['key1', 'key2'],
    maxAge:  3600 * 1000 // 1hr
}));

// DECLARING CUSTOM MIDDLEWARE
const ifNotLoggedin = (req, res, next) => {
    if(!req.session.isLoggedIn){
        return res.render('login-register');
    }
    next();
}
const ifLoggedin = (req,res,next) => {
    if(req.session.isLoggedIn){
        return res.redirect('/home-default');
    }
    next();
}
// END OF CUSTOM MIDDLEWARE
// ROOT PAGE
app.get('/', ifNotLoggedin, (req,res,next) => {
    dbConnection.execute("SELECT `name` FROM `users` WHERE `id`=?",[req.session.userID])
    .then(([rows]) => {
        res.render('home-default',{
            name:rows[0].name
        });
    });
    
});// END OF ROOT PAGE


// REGISTER PAGE
app.post('/register', ifLoggedin, 
// post data validation(using express-validator)
[
    body('user_email','Invalid email address!').isEmail().custom((value) => {
        return dbConnection.execute('SELECT `email` FROM `users` WHERE `email`=?', [value])
        .then(([rows]) => {
            if(rows.length > 0){
                return Promise.reject('This E-mail already in use!');
            }
            return true;
        });
    }),
    body('user_name','Username is Empty!').trim().not().isEmpty(),
    body('user_pass','The password must be of minimum length 6 characters').trim().isLength({ min: 6 }),
],// end of post data validation
(req,res,next) => {

    const validation_result = validationResult(req);
    const {user_name, user_pass, user_email} = req.body;
    // IF validation_result HAS NO ERROR
    if(validation_result.isEmpty()){
        // password encryption (using bcryptjs)
        bcrypt.hash(user_pass, 12).then((hash_pass) => {
            // INSERTING USER INTO DATABASE
            dbConnection.execute("INSERT INTO `users`(`name`,`email`,`password`) VALUES(?,?,?)",[user_name,user_email, hash_pass])
            .then(result => {
                res.send(`your account has been created successfully, Now you can <a href="/">Login</a>`);
            }).catch(err => {
                // THROW INSERTING USER ERROR'S
                if (err) throw err;
            });
        })
        .catch(err => {
            // THROW HASING ERROR'S
            if (err) throw err;
        })
    }
    else{
        // COLLECT ALL THE VALIDATION ERRORS
        let allErrors = validation_result.errors.map((error) => {
            return error.msg;
        });
        // REDERING login-register PAGE WITH VALIDATION ERRORS
        res.render('login-register',{
            register_error:allErrors,
            old_data:req.body
        });
    }
});// END OF REGISTER PAGE


// LOGIN PAGE
app.post('/', ifLoggedin, [
    body('user_email').custom((value) => {
        return dbConnection.execute('SELECT email FROM users WHERE email=?', [value])
        .then(([rows]) => {
            if(rows.length == 1){
                return true;
                
            }
            return Promise.reject('Invalid Email Address!');
            
        });
    }),
    body('user_pass','Password is empty!').trim().not().isEmpty(),
], (req, res) => {
    const validation_result = validationResult(req);
    const {user_pass, user_email} = req.body;
    if(validation_result.isEmpty()){
        
        dbConnection.execute("SELECT * FROM `users` WHERE `email`=?",[user_email])
        .then(([rows]) => {
            bcrypt.compare(user_pass, rows[0].password).then(compare_result => {
                if(compare_result === true){
                    req.session.isLoggedIn = true;
                    req.session.userID = rows[0].id;

                    res.redirect('/');
                }
                else{
                    res.render('login-register',{
                        login_errors:['Invalid Password!']
                    });
                }
            })
            .catch(err => {
                if (err) throw err;
            });


        }).catch(err => {
            if (err) throw err;
        });
    }
    else{
        let allErrors = validation_result.errors.map((error) => {
            return error.msg;
        });
        // REDERING login-register PAGE WITH LOGIN VALIDATION ERRORS
        res.render('login-register',{
            login_errors:allErrors
        });
    }
});
// END OF LOGIN PAGE
app.get('/newhot', (req,res) => {
    res.render('newhot');
})
app.get('/home', (req,res) => {
    res.render('home');
})
app.get('/ctg', (req,res) => {
    res.render('ctg');
})
app.get('/hot', (req,res) => {
    res.render('hot');
})
app.get('/interest', (req,res) => {
    res.render('interest');
})
app.get('/profile-aladdin', (req,res) => {
    dbConnection.execute("SELECT * FROM `movie` JOIN `publisher` ON movie.PublisherID = publisher.publisherId JOIN  `genre_of` ON movie.MovieID = genre_of.MovieID",[req.session])
         .then(([rows]) => {
             res.render('profile-aladdin',{
                 name:rows[0].Name,
                 syn:rows[0].Synopsis,
                 pName:rows[0].publisherName,
                 Lname:rows[0].LeadActor,
                 genre:rows[0].GenreName
             });
         });    
 })
 app.get('/profile-aot', (req,res) => {
    dbConnection.execute("SELECT * FROM `movie` JOIN `publisher` ON movie.PublisherID = publisher.publisherId JOIN  `genre_of` ON movie.MovieID = genre_of.MovieID",[req.session])
         .then(([rows]) => {
             res.render('profile-aot',{
                 name:rows[1].Name,
                 syn:rows[1].Synopsis,
                 pName:rows[1].publisherName,
                 Lname:rows[1].LeadActor,
                 genre:rows[1].GenreName
             });
         });   
 })
 app.get('/profile-avengers', (req,res) => {
    dbConnection.execute("SELECT * FROM `movie` JOIN `publisher` ON movie.PublisherID = publisher.publisherId JOIN  `genre_of` ON movie.MovieID = genre_of.MovieID",[req.session])
         .then(([rows]) => {
             res.render('profile-avengers',{
                 name:rows[2].Name,
                 syn:rows[2].Synopsis,
                 pName:rows[2].publisherName,
                 Lname:rows[2].LeadActor,
                 genre:rows[2].GenreName
             });
         });   
 })
 app.get('/profile-beauty', (req,res) => {
    dbConnection.execute("SELECT * FROM `movie` JOIN `publisher` ON movie.PublisherID = publisher.publisherId JOIN  `genre_of` ON movie.MovieID = genre_of.MovieID",[req.session])
         .then(([rows]) => {
             res.render('profile-beauty',{
                 name:rows[3].Name,
                 syn:rows[3].Synopsis,
                 pName:rows[3].publisherName,
                 Lname:rows[3].LeadActor,
                 genre:rows[3].GenreName
             });
         });  
 })
app.get('/profile-demon', (req,res) => {
    dbConnection.execute("SELECT * FROM `movie` JOIN `publisher` ON movie.PublisherID = publisher.publisherId JOIN  `genre_of` ON movie.MovieID = genre_of.MovieID",[req.session])
    .then(([rows]) => {
        res.render('profile-demon',{
            name:rows[4].Name,
            syn:rows[4].Synopsis,
            pName:rows[4].publisherName,
            Lname:rows[4].LeadActor,
            genre:rows[4].GenreName
        });
    });  
})
app.get('/profile-fanta', (req,res) => {
    dbConnection.execute("SELECT * FROM `movie` JOIN `publisher` ON movie.PublisherID = publisher.publisherId JOIN  `genre_of` ON movie.MovieID = genre_of.MovieID",[req.session])
    .then(([rows]) => {
        res.render('profile-fanta',{
            name:rows[5].Name,
            syn:rows[5].Synopsis,
            pName:rows[5].publisherName,
            Lname:rows[5].LeadActor,
            genre:rows[5].GenreName
        });
    });  
})
app.get('/profile-frozen', (req,res) => {
    dbConnection.execute("SELECT * FROM `movie` JOIN `publisher` ON movie.PublisherID = publisher.publisherId JOIN  `genre_of` ON movie.MovieID = genre_of.MovieID",[req.session])
    .then(([rows]) => {
        res.render('profile-frozen',{
            name:rows[7].Name,
            syn:rows[7].Synopsis,
            pName:rows[7].publisherName,
            Lname:rows[7].LeadActor,
            genre:rows[7].GenreName
        });
    });  
})
app.get('/profile-godf', (req,res) => {
    dbConnection.execute("SELECT * FROM `movie` JOIN `publisher` ON movie.PublisherID = publisher.publisherId JOIN  `genre_of` ON movie.MovieID = genre_of.MovieID",[req.session])
    .then(([rows]) => {
        res.render('profile-godf',{
            name:rows[16].Name,
            syn:rows[16].Synopsis,
            pName:rows[16].publisherName,
            Lname:rows[16].LeadActor,
            genre:rows[16].GenreName
        });
    }); 
})
app.get('/profile-godzi', (req,res) => {
    dbConnection.execute("SELECT * FROM `movie` JOIN `publisher` ON movie.PublisherID = publisher.publisherId JOIN  `genre_of` ON movie.MovieID = genre_of.MovieID",[req.session])
    .then(([rows]) => {
        res.render('profile-godzi',{
            name:rows[8].Name,
            syn:rows[8].Synopsis,
            pName:rows[8].publisherName,
            Lname:rows[8].LeadActor,
            genre:rows[8].GenreName
        });
    }); 
})
app.get('/profile-gump', (req,res) => {
    dbConnection.execute("SELECT * FROM `movie` JOIN `publisher` ON movie.PublisherID = publisher.publisherId JOIN  `genre_of` ON movie.MovieID = genre_of.MovieID",[req.session])
    .then(([rows]) => {
        res.render('profile-gump',{
            name:rows[6].Name,
            syn:rows[6].Synopsis,
            pName:rows[6].publisherName,
            Lname:rows[6].LeadActor,
            genre:rows[6].GenreName
        });
    }); 
})
app.get('/profile-hei', (req,res) => {
    dbConnection.execute("SELECT * FROM `movie` JOIN `publisher` ON movie.PublisherID = publisher.publisherId JOIN  `genre_of` ON movie.MovieID = genre_of.MovieID",[req.session])
    .then(([rows]) => {
        res.render('profile-hei',{
            name:rows[17].Name,
            syn:rows[17].Synopsis,
            pName:rows[17].publisherName,
            Lname:rows[17].LeadActor,
            genre:rows[17].GenreName
        });
    }); 
})
app.get('/profile-joker', (req,res) => {
    dbConnection.execute("SELECT * FROM `movie` JOIN `publisher` ON movie.PublisherID = publisher.publisherId JOIN  `genre_of` ON movie.MovieID = genre_of.MovieID",[req.session])
    .then(([rows]) => {
        res.render('profile-Joker',{
            name:rows[9].Name,
            syn:rows[9].Synopsis,
            pName:rows[9].publisherName,
            Lname:rows[9].LeadActor,
            genre:rows[9].GenreName
        });
    }); 
})
app.get('/profile-lala', (req,res) => {
    dbConnection.execute("SELECT * FROM `movie` JOIN `publisher` ON movie.PublisherID = publisher.publisherId JOIN  `genre_of` ON movie.MovieID = genre_of.MovieID",[req.session])
    .then(([rows]) => {
        res.render('profile-lala',{
            name:rows[10].Name,
            syn:rows[10].Synopsis,
            pName:rows[10].publisherName,
            Lname:rows[10].LeadActor,
            genre:rows[10].GenreName
        });
    });
})
app.get('/profile-me', (req,res) => {
    dbConnection.execute("SELECT * FROM `movie` JOIN `publisher` ON movie.PublisherID = publisher.publisherId JOIN  `genre_of` ON movie.MovieID = genre_of.MovieID",[req.session])
    .then(([rows]) => {
        res.render('profile-me',{
            name:rows[12].Name,
            syn:rows[12].Synopsis,
            pName:rows[12].publisherName,
            Lname:rows[12].LeadActor,
            genre:rows[12].GenreName
        });
    });
})
app.get('/profile-myhero', (req,res) => {
    dbConnection.execute("SELECT * FROM `movie` JOIN `publisher` ON movie.PublisherID = publisher.publisherId JOIN  `genre_of` ON movie.MovieID = genre_of.MovieID",[req.session])
    .then(([rows]) => {
        res.render('profile-myhero',{
            name:rows[13].Name,
            syn:rows[13].Synopsis,
            pName:rows[13].publisherName,
            Lname:rows[13].LeadActor,
            genre:rows[13].GenreName
        });
    });
})
app.get('/profile-raya', (req,res) => {
    dbConnection.execute("SELECT * FROM `movie` JOIN `publisher` ON movie.PublisherID = publisher.publisherId JOIN  `genre_of` ON movie.MovieID = genre_of.MovieID",[req.session])
    .then(([rows]) => {
        res.render('profile-raya',{
            name:rows[14].Name,
            syn:rows[14].Synopsis,
            pName:rows[14].publisherName,
            Lname:rows[14].LeadActor,
            genre:rows[14].GenreName
        });
    });
})
app.get('/profile-shaw', (req,res) => {
    dbConnection.execute("SELECT * FROM `movie` JOIN `publisher` ON movie.PublisherID = publisher.publisherId JOIN  `genre_of` ON movie.MovieID = genre_of.MovieID",[req.session])
    .then(([rows]) => {
        res.render('profile-shaw',{
            name:rows[18].Name,
            syn:rows[18].Synopsis,
            pName:rows[18].publisherName,
            Lname:rows[18].LeadActor,
            genre:rows[18].GenreName
        });
    });
})
app.get('/profile-spirit', (req,res) => {
    dbConnection.execute("SELECT * FROM `movie` JOIN `publisher` ON movie.PublisherID = publisher.publisherId JOIN  `genre_of` ON movie.MovieID = genre_of.MovieID",[req.session])
    .then(([rows]) => {
        res.render('profile-spirit',{
            name:rows[15].Name,
            syn:rows[15].Synopsis,
            pName:rows[15].publisherName,
            Lname:rows[15].LeadActor,
            genre:rows[15].GenreName
        });
    });
})
app.get('/profile-template', (req,res) => {
    res.render('profile-template');
})
app.get('/profile-titanic', (req,res) =>{
   dbConnection.execute("SELECT * FROM `movie` JOIN `publisher` ON movie.PublisherID = publisher.publisherId JOIN  `genre_of` ON movie.MovieID = genre_of.MovieID",[req.session])
    .then(([rows]) => {
        res.render('profile-titanic',{
            name:rows[19].Name,
            syn:rows[19].Synopsis,
            pName:rows[19].publisherName,
            Lname:rows[19].LeadActor,
            genre:rows[19].GenreName
        });
    });    
})
app.get('/profile-women', (req,res) => {
    dbConnection.execute("SELECT * FROM `movie` JOIN `publisher` ON movie.PublisherID = publisher.publisherId JOIN  `genre_of` ON movie.MovieID = genre_of.MovieID",[req.session])
    .then(([rows]) => {
        res.render('profile-women',{
            name:rows[11].Name,
            syn:rows[11].Synopsis,
            pName:rows[11].publisherName,
            Lname:rows[11].LeadActor,
            genre:rows[11].GenreName
        });
    }); 
})
app.get('/recommend', (req,res) => {
    res.render('recommend');
})

app.get('/template', (req,res) => {
    res.render('template');
})
app.get('/trailer-aladdin', (req,res) => {
    res.render('trailer-aladdin');
})
app.get('/trailer-aot', (req,res) => {
    res.render('trailer-aot');
})
app.get('/trailer-avengers', (req,res) => {
    res.render('trailer-avengers');
})
app.get('/trailer-beauty', (req,res) => {
    res.render('trailer-beauty');
})
app.get('/trailer-demon', (req,res) => {
    res.render('trailer-demon');
})
app.get('/trailer-fanta', (req,res) => {
    res.render('trailer-fanta');
})
app.get('/trailer-frozen', (req,res) => {
    res.render('trailer-frozen');
})
app.get('/trailer-godf', (req,res) => {
    res.render('trailer-godf');
})
app.get('/trailer-godzi', (req,res) => {
    res.render('trailer-godzi');
})
app.get('/trailer-gump', (req,res) => {
    res.render('trailer--gump');
})
app.get('/trailer-hei', (req,res) => {
    res.render('trailer-hei');
})
app.get('/trailer-joker', (req,res) => {
    res.render('trailer-joker');
})
app.get('/trailer-lala', (req,res) => {
    res.render('trailer-lala');
})
app.get('/trailer-me', (req,res) => {
    res.render('trailer-me');
})
app.get('/trailer-myhero', (req,res) => {
    res.render('trailer-myhero');
})
app.get('/trailer-raya', (req,res) => {
    res.render('trailer-raya');
})
app.get('/trailer-shaw', (req,res) => {
    res.render('trailer-shaw');
})
app.get('/trailer-spirit', (req,res) => {
    res.render('trailer-spirit');
})
app.get('/trailer-template', (req,res) => {
    res.render('trailer-template');
})
app.get('/trailer-titanic', (req,res) => {
    res.render('trailer-titanic');
})
app.get('/trailer-women', (req,res) => {
    res.render('trailer-women');
})
app.get('/watch', (req,res) => {
    res.render('watch');
})
// LOGOUT
app.get('/logout',(req,res)=>{
    //session destroy
    req.session = null;
    res.redirect('/');
});

// END OF LOGOUT

app.use('/', (req,res) => {
    res.status(404).send('<h1>404 Page Not Found!</h1>');
});



app.listen(3000, () => console.log("Server is Running..."));