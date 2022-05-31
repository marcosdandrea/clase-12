const express = require('express');
const path = require("path")
const Contenedor = require('./contenedor');
var socketIOfileUpload = require("socketio-file-upload");
const { Server: HttpServer } = require("http")
const { Server: SocketServer } = require("socket.io");

const app = express();
const PORT = 8080;
const messageCentral = []

const contenedor = new Contenedor("products.json")
const contenedorMsg = new Contenedor("messages.json")

app.use(socketIOfileUpload.router)
app.use("/", express.static("public"))

const httpServer = new HttpServer(app)
const socketServer = new SocketServer(httpServer)


socketServer.on("connection", socket => {

    //new user initizalization routine
    const uploader = new socketIOfileUpload();
    uploader.dir = path.join(__dirname, "/public/images")
    uploader.listen(socket);
    console.log("A new user has connected")
    sendAllProducts(socket)
    sendAllMessages(socket)
    
    socket.on("newProduct", newProduct => {
        console.log("New product received")
        newProduct = JSON.parse(newProduct)
        contenedor.save(newProduct)
            .then(() => sendAllProducts(socketServer.sockets))
    })

    socket.on("newMessage", message => {
        contenedorMsg.save(message)
            .then(() => sendAllMessages(socketServer.sockets))

    })
})

const sendAllMessages = (socket) => {
    return new Promise((resolve, reject) => {
        contenedorMsg.getAll()
            .then((messages) => {
                if (messages.length == 0){
                    socket.emit("newMessages", JSON.stringify({}))
                    resolve()
                }
                else{
                    socket.emit("newMessages", JSON.stringify(messages))
                    resolve()
                }
            })
            .catch((err) => {
                console.log(err)
                socket.emit("error", JSON.stringify({}))
                resolve()
            })
    })
}

const sendAllProducts = (socket) => {
    return new Promise((resolve, reject) => {

    contenedor.getAll()
        .then((products) => {
            if (products.length == 0){
                socket.emit("productList", JSON.stringify({}))
                resolve()}
            else
               { socket.emit("productList", JSON.stringify(products))
                resolve()}
        })
        .catch((err) => {
            console.log(err)
            socket.emit("error", JSON.stringify({}))
            resolve()
        })
    })
}

httpServer.listen(PORT, () => {
    console.log("Server listening on port " + PORT)
});


