var mysql = require("mysql");
var http = require("http");
var inquirer = require("inquirer");
require("dotenv").config()


// Create instance of express app.


// Set the port of our application
// process.env.PORT lets the port be set by Heroku
var PORT = process.env.PORT || 8080;

// MySQL DB Connection Information 
var connection = mysql.createConnection({
  host: "localhost",
  port: 3306,
  user: "root",
  password: process.env.password,
  database: "bamazon"
});

connection.connect(function(err) {
    if (err) throw err;
    console.log("connected as id " + connection.threadId + "\n");

    runSearch();
  });

  function runSearch() {
    connection.query("SELECT * FROM products", function(err, res) {
      if (err) throw err;
  
      // Table response
      console.table(res);
  
      // The customer's choice of product
      customerItem(res);
    });
  }
  
  function customerItem(inventory) {
    inquirer
      .prompt([{
        name: "id",
        type: "input",
        message: "What is the ID of the product you'd like to buy? #1-10 and quit with q",
        validate: function(val) {
          return !isNaN(val) || val.toLowerCase() === "q";
        }
      }
    ]).then(function(val){
      checkExit(val.choice);
      var idChosen = parseInt(val.choice);
      var product = checkInventory(idChosen, inventory);

      // prompt the customer for a desired quantity
      if (product) {
        // Pass the chosen product to customerQuantity
        customerQuantity(product);
      }
      else {
        // item not in search
        console.log("\nThat item is not in the inventory.");
        runSearch();
      }
    });
}
//asking customer for desired quantity
function customerQuantity(product) {
  inquirer
    .prompt([
      {
        type: "input",
        name: "quantity",
        message: "How many would you like to buy?",
        validate: function(val) {
          return val > 0 || val.toLowerCase() === "q";
        }
      }
    ])
    .then(function(val) {
      // Check if the user wants to quit 
      
      checkExit(val.quantity);
      var quantity = parseInt(val.quantity);

      // check quatity
      if (quantity > product.stock_quantity) {
        console.log("Insufficient quantity!");
        runSearch();
      }
      else {
        // run makePurchase
        makePurchase(product, quantity);
      }
    });
}

// Purchase the item and respected quantity 
function makePurchase(product, quantity) {
  connection.query(
    "UPDATE products SET stock_quantity = stock_quantity - ? WHERE item_id = ?",
    [quantity, product.item_id],
    function(err, res) {
      console.log("purchased " + quantity + " " + product.product_name + " ");
      runSearch();
    }
  );
}

// confirm quantity of product 
function checkInventory(choiceId, inventory) {
  for (var i = 0; i < inventory.length; i++) {
    if (inventory[i].item_id === choiceId) {
      // return the product
      return inventory[i];
    }
  }
  return null;
}

//Check to see if the user types q to quit
function checkExit(choice) {
  if (choice.toLowerCase() === "q") {
    console.log("Purchase Made!");
    process.exit(0);
  }
}

    