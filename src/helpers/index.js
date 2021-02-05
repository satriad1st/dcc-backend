module.exports = {  
  /**
   * Checking is email valid
   * return boolean
   * 
   * @param String mail
   */  

  validateEmail: (mail) => {
    if (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(mail)){
      return (true);
    }      
      return (false);
  },

  validatePhoneNumber: (phoneNumber) => {
    const phone = /^\d{13}$/;
    if (phoneNumber.match(phone)) {
      return (true);
    }
    return (false);
  },

  formatNumberDefaultIndo: (phoneNumber)=>{
    phoneNumber = phoneNumber.trim();
    let result;
    
    if(phoneNumber.substring(0,2)=="+0"){
      result = phoneNumber.replace("+0","62")
    }
    else if(phoneNumber.substring(0,6)=="626262"){
      result = phoneNumber.substring(4);
    } 
    else if(phoneNumber.substring(0,3)=="620"){
      result = phoneNumber.substring(3);
      result = `62${result}`
    } 
    else if(phoneNumber.substring(0,4)=="6262"){
      result = phoneNumber.substring(2);
    } 
    else if(phoneNumber.substring(0,2)=="62"){
      result = phoneNumber;
    }else if(phoneNumber.substring(0,3)=="+62" || phoneNumber.substring(0,1)=="+"){
      result = phoneNumber.substring(1)
    } else if(phoneNumber.substring(0,1)=="0"){
      result = phoneNumber.replace("0","62")
    } else{
      result = `62${phoneNumber}`
    }
    return result;
  },

  formatRupiah: (number,prefix) => {
    var	number_string = number.toString(),
    sisa 	= number_string.length % 3,
    rupiah 	= number_string.substr(0, sisa),
    ribuan 	= number_string.substr(sisa).match(/\d{3}/g);
      
      if (ribuan) {
        separator = sisa ? '.' : '';
        rupiah += separator + ribuan.join('.');
      }

      return rupiah;
    },
  
  getCurrentDateTime: (separator="-",value=null) => {
        let newDate = value == null ? new Date : new Date(value);
        let date = newDate.getDate();
        let month = newDate.getMonth() + 1;
        let year = newDate.getFullYear();
        var h = newDate.getHours(); 
        var m = newDate.getMinutes(); 
        var s = newDate.getSeconds(); 
        
        return `${year}${separator}${month<10?`0${month}`:`${month}`}${separator}${date<10?`0${date}`:`${date}`}_${h}:${m}:${s}_`
  }

    

}