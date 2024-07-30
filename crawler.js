const fs = require('fs');
const axios = require('axios');


/**
 * 取得紀錄資料
 *
 * @returns {Promise<Array>} 一個 Promise,解析為包含記錄數據的數組。
 *                           如果發生錯誤或數據無效,則解析為空數組。
 */
function getRecordData() {
  return new Promise((resolve, reject) => {
    fs.readFile('record.json', 'utf8', (err, data) => {
      if (err) {
        console.error('Error reading JSON file:', err);
        resolve([]);
      } else {
				const responseData = data && JSON.parse(data) || [];
				resolve(responseData);
      }
    });
  });
}

/**
 * 寫入紀錄至 record.json
 *
 * @param {*} data
 */
function writeRecord(data) {
	const jsonData = JSON.stringify(data, null, 2);

	// 寫入 JSON 檔案
	fs.writeFile('record.json', jsonData, (err) => {
		if (err) {
			console.error('Error writing JSON file:', err);
		} else {
			console.log('Data has been written to recode.json');
		}
	});
}

/**
 * 過濾爬到的資料
 *
 * @param {*} data
 * @return {*} 
 */
function getCrawlerData(data) {
	return data
	.filter(x => x.Status === 'verified' && Number(x.Score) >= 0)
	.map(({Label, Sw_Coupon__, Score}) => { return { Label, Sw_Coupon__, Score}});
}

axios.get('https://swq.jp/_special/rest/Sw/Coupon')
  .then(async response => {
		const data = response.data?.data;
		if(data) {
			const recordData = await getRecordData();
			const result = getCrawlerData(data);

			const lastDataIndex = recordData.length
				? result.findIndex(item => item.Label === recordData[0].Label)
				: -1;

			const uniqueData = lastDataIndex === -1
				? result
				: result.slice(0, lastDataIndex);
	
			if(uniqueData.length) {
				writeRecord(uniqueData);

				const outputLinkArray = uniqueData.map((x) => `http://withhive.me/313/${x.Label}`);
				// 輸出到控制台，GitHub Actions 可以捕獲這個輸出
				console.log('UNIQUE_DATA:' + JSON.stringify(outputLinkArray));
			} else {
        console.log('UNIQUE_DATA:[]');
      }

		}
  })
  .catch(error => {
    console.error('Error fetching JSON data:', error);
  });