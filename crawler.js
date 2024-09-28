const fs = require('fs');
const axios = require('axios');
const itemArray = {
	energy: "能量",
	mana: "魔力石",
	crystal: "水晶",
	summon_exclusive: "刻印召喚書碎片",
	scroll_water: "水屬性召喚書",
	scroll_fire: "火屬性召喚書",
	scroll_wind: "風屬性召喚書",
	scroll_mystical: "神秘召喚書",
	scroll_light_and_dark: "光明/黑暗召喚書",
}

/**
 * 取得紀錄資料
 *
 * @returns {Promise<Array>} 記錄上次最後一筆 coupon。
 *                           如果發生錯誤或數據無效,則回傳空陣列。
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
 * @typedef {Object} ResourceItem
 * @property {string} Quantity - 數量
 * @property {string} Code - 道具
 */
/**
 * @typedef {Object} CrawlerItem
 * @property {string} Label - 兌換碼
 * @property {Array<ResourceItem>} Resource - 兌換碼道具
 */
/**
 * 抓取的資料做整理
 * @param {Array<{
*   Status: string, 
*   Score: string, 
*   Label: string, 
*   Resources: Array<{
*     Quantity: string, 
*     Sw_Resource: {
*       Code: string
*     }
*   }>
* }>} data - The raw crawler data
* @returns {Array<CrawlerItem>} The filtered and transformed data
*/
function getCrawlerData(data) {
	return data
		.filter(x => x.Status === 'verified' && Number(x.Score) >= 0)
		.map(({ Label, Resources }) => {
			return {
				Label,
				Resource: Resources.map(resource => ({
					Quantity: resource.Quantity,
					Code: resource.Sw_Resource.Code
				}))
			};
		});
}

// 抓取資料並作動
axios.get('https://swq.jp/_special/rest/Sw/Coupon')
	.then(async response => {
		const data = response.data?.data;
		if (data) {
			// 取得上一次紀錄的最後一筆資料
			const recordData = await getRecordData();

			// 將抓取的資料做整理
			const result = getCrawlerData(data);

			const lastDataIndex = recordData.length
				? result.findIndex(item => item.Label === recordData[0].Label)
				: -1;

			const uniqueData = lastDataIndex === -1
				? result
				: result.slice(0, lastDataIndex);

			console.log("🚀 -----------------------------------------🚀")
			console.log("🚀 ~ uniqueData.length:", uniqueData.length)
			console.log("🚀 -----------------------------------------🚀")
			if (uniqueData.length) {
				// 寫入整合資料的第一筆作為下次索引用
				writeRecord([uniqueData[0]]);

				const outputLinkArray = uniqueData.map((x) => {
					const link = `http://withhive.me/313/${x.Label}`;
					const items = x.Resource.map((item) => `${itemArray[item.Code] ?? item.Code}*${item.Quantity}`);
					return `${link} -> ${items.join(' & ')}`;
				}
				);
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