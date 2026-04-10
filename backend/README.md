 cai nodejs va xampp
 sau do bat xampp len vao phpmyadmin mysql import file scdl
 
 cd .\backend\
 npm install
 npm run dev  

  cd .\frontend\
 npm install
 npm run dev  

 DEBMETKKOZ4WSJADSUDW66VX5M7NB908
3c13820529b07a7ea2dd0c537f07d4a8b007865a9175b74115a83e537204365f2301048edb91ef6eb0eca4863b53b4e63cb453e83a9103aef17cbdaeded62692

fetch('https://habana-sport-backend.onrender.com/api/payment/vnpay-create', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + localStorage.getItem('hs_token')
  },
  body: JSON.stringify({ order_id: 1 })
}).then(r=>r.json()).then(d=>console.log(JSON.stringify(d)))


Ngân hàng: NCB
Số thẻ: 9704198526191432198
Tên chủ thẻ: NGUYEN VAN A
Ngày phát hành: 07/15
OTP: 123456

npm install -g ngrok
ngrok http 5000
ngrok config add-authtoken 3C7os5YH0zRECsjTHlvNyMY2hr7_3eacJKNudH1Yz4E3XFWMp