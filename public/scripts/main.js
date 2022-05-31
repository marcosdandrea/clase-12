let socket
let uploader
let productTemplates
let messagesTemplates

fetch("http://localhost:8080/template/products.hbs")
    .then(res => res.text())
    .then(baseTemplate => {
        productTemplates = Handlebars.compile(baseTemplate)
        fetch("http://localhost:8080/template/messages.hbs")
            .then(res => res.text())
            .then(baseTemplate => {
                messagesTemplates = Handlebars.compile(baseTemplate)
                initizalizeComponents()
                startListeners()
            })
    })
    .catch((err) => {
        console.log(err)
    })

function initizalizeComponents() {
    socket = io()
    uploader = new SocketIOFileUpload(socket);
}

function startListeners() {

    socket.on("productList", products => {
        const context = JSON.parse(products);
        const html = productTemplates({ products: context });
        document.getElementById("hbsProducts").innerHTML = html;
    })

    socket.on("newMessages", messages => {
        const context = JSON.parse(messages);
        const html = messagesTemplates({ messages: context });
        const hbsMessages = document.getElementById("hbsMessages")
        hbsMessages.innerHTML = html
        hbsMessages.scroll(0, hbsMessages.childElementCount * 20);
    })

    uploader.addEventListener("complete", enviarProducto)
    uploader.listenOnSubmit(document.getElementById("btnSubmit"), document.getElementById("fileImage"));
    document.getElementById("btnSendMessage").addEventListener("click", sendMessage)
}

const sendMessage = () => {
    const from = document.querySelector("#inputEmail").value
    const content = document.querySelector("#inputContent").value
    const time = new Date().toLocaleString()
    if (from == "" || content == "" || !validateEmail(from)){
        alert ("Debe ingresar un correo válido y escribir un mensaje para poder enviar")
        return;
    }
    socket.emit("newMessage", { from, time, content })
}

const enviarProducto = () => {
    console.log("producto cargado")
    const productName = document.querySelector("#title").value
    const productPrice = document.querySelector("#price").value
    let productImage = document.querySelector("#fileImage").value
    productImage = "../images/" + productImage.split("\\").at(-1)

    const newProduct = { productName, productPrice, productImage }

    socket.emit("newProduct", JSON.stringify(newProduct))
    console.log("new product sended")
    return false
}

const validateEmail = (email) => {
    return String(email)
      .toLowerCase()
      .match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      );
  };