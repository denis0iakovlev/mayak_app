import axios from "axios"
const API_URL= process.env.NEXT_PUBLIC_API_URL

const apiSrv = axios.create({
    baseURL:API_URL,
    timeout:5000,
    headers:{
        "Content-Type":"application/json"
    }
})

export default apiSrv;