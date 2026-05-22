update the reponse data of each endpoint to ONLY return data that are relevant to the request made and data should be in the format of 

```json
{
  "msg":_, 
  "data":_, 
  "type":_, 
  "code":_
}
```

Bad respose example: {...createdAt, updatedAt, password }

Good response example:{
  "msg":"login succes", 
  "data":{"f_name":"Jon", "l_name":""}, 
  "type":"", 
  "code":600
}