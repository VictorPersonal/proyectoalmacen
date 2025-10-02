
const express = require('express');
const router = express.Router();

const pool = require('../config/db');

router.get('/', (req, res) => {
    pool.query('SELECT * FROM clienteusuario',(error,result)=>{
        if(error){
            throw error;
        }
        else{
            res.send(result);
        }
    })
})

module.exports = router;