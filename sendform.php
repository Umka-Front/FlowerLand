<?php
//Сбор данных из полей формы. 
$name = $_POST['name'];// Берём данные из input c атрибутом name="name"
$phone = $_POST['phone']; // Берём данные из input c атрибутом name="phone"
$buket = $_POST['buket']; // Берём данные из input c атрибутом name="mail"

$token = "1661912834:AAHslm_SNCqtjvyoa8I-ZGEmYvA6_oyg1cE"; // Тут пишем токен
$chat_id = "-512659911"; // Тут пишем ID группы, куда будут отправляться сообщения
$sitename = "FleurDeVero landing букеты"; //Указываем название сайта

$arr = array(

  'Заказ с сайта: ' => $sitename,
  'Имя: ' => $name,
  'Телефон: ' => $phone,
  'ID Букета: ' => $buket
);

foreach($arr as $key => $value) {
  $txt .= "<b>".$key."</b> ".$value."%0A";
};

$sendToTelegram = fopen("https://api.telegram.org/bot{$token}/sendMessage?chat_id={$chat_id}&parse_mode=html&text={$txt}","r");

?>