function upload(txt, suf) {
    // 上传的内容
    let xhr4 = new XMLHttpRequest();
    const uuyrt = txt;
    let md5tr=md5(uuyrt);
    let filename = md5tr+"."+suf
    xhr4.open('GET', "https://code.xueersi.com/api/assets/get_oss_upload_params?scene=offline_python_assets&md5="+md5tr+"&filename="+filename,true)
    xhr4.send()
    xhr4.onload = () => {
        if(xhr4.status == 200){
            let dart=JSON.parse(xhr4.responseText).data
            let xhr5 = new XMLHttpRequest()
            xhr5.open('PUT', dart.host,true)
            for(let sd in dart.headers)
            {
                xhr5.setRequestHeader(sd, dart.headers[sd])
            }
            xhr5.send(uuyrt)
            xhr5.onload = () => {
                if(xhr5.status == 200){
                    window.alert("已发送到"+dart.url);
                }
                else
                {
                    window.alert("发送失败"+xhr5.status);
                }
            }
        }
        else{
            window.alert(`error ${xhr4.status}`)
            console.log(`error ${xhr4.status}`)
        }
    }
}
function comment(txt) {
    // 要评论的链接
    let work_data1 = window.location.search;
    const work_type = work_data1.split("&")[3].split("=")[1];
    work_data1 = work_data1.split("&")[1].split("=")[1];
    // 注意：有cookie
    const header = {
        'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/102.0.5005.63 Safari/537.36 Edg/102.0.1245.33',
        'Cookie':String(document.cookie)
    }
    let data;
    if(work_type=="cpp")
    {
        data={
            "appid":1001108,
            "topic_id":"CC_"+work_data1,
            "target_id":0,
            "content":txt
        };
    }
    else if(work_type=="scratch")
    {
        data={
            "appid":1001108,
            "topic_id":"CS_"+work_data1,
            "target_id":0,
            "content":txt
        };
    }
    else
    {
        data={
            "appid":1001108,
            "topic_id":"CP_"+work_data1,
            "target_id":0,
            "content":txt
        };
    }
    let xhr = new XMLHttpRequest();
    xhr.open('POST', "https://code.xueersi.com/api/comments/submit",true);
    xhr.setRequestHeader('Content-Type', "application/json");
    xhr.send(JSON.stringify((header,data)));
}
function info() {
    return new Promise((resolve, reject) => {
        let xhr = new XMLHttpRequest();

        xhr.open(
            'GET',
            'https://code.xueersi.com/api/comments?appid=1001108&topic_id=CP_68079584&parent_id=0&page=1&per_page=15'
        );

        xhr.onload = function () {
            try {
                let data = JSON.parse(xhr.responseText);
                let dart = data?.data?.data?.[0]?.content;
                resolve(dart);
            } catch (e) {
                reject(e);
            }
        };

        xhr.onerror = function () {
            reject(new Error('请求失败'));
        };

        xhr.send();
    });
}
// 调用
info().then(res => {
    console.log(res);
})