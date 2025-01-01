function alertCardState(){
    alert("Your card is empty")
}
function changeImgSrc(el){
    el.src = "./images/assets/succulents-1.jpg"
}
function remove(el){
    var box = document.querySelector("."+el)
    box.remove()
}