/// <reference path="jquery-3.6.0.js" />
$(() => {
    "use strict";
    let coins = [];//Global array of coins.
    $("section").hide();//Hide all pages.
    $("#homeSection").show();//Display only home page(page 1). 

    $("a").on("click", function () {//Display selected page,and hide other pages. 
        const dataSection = $(this).attr("data-section")
        $("section").hide();
        $("#" + dataSection).show();
    });

    $("#homeSection").on("click", ".card > button", async function () {//Display more information on specific card/
        const coinId = $(this).attr("id");
        const loadingSpan = $(this).next().next();
        const coin = await getMoreInfo(coinId, loadingSpan);
        $(loadingSpan).remove();
        const coinData = `${coin.market_data.current_price.usd},${coin.market_data.current_price.eur},${coin.market_data.current_price.ils}`;

        setTimeout(() => localStorage.clear(), 120000);
        localStorage.setItem(coinId, coinData);

        const content = `
                <br>
              USD :$${coin.market_data.current_price.usd} <br>
              EUR :€${coin.market_data.current_price.eur} <br>
              ILS :₪${coin.market_data.current_price.ils}    `

        $(this).next().html(content).toggle();
    });

    $("#myInput").on("keyup", function () {//Search coin/         
        let textToSearch = $(this).val().toLowerCase().trim();
        $(this).focus();
        if (textToSearch === "") {
            displayCoins(coins);
        }
        else {
            $("#homeSection .card").show().filter(function () {
                return $(this).text().toLowerCase().trim().indexOf(textToSearch) == -1;
            }).hide();
        }
    });

    handleCoins();

    async function handleCoins() {// Get coins data from API.
        try {
            coins = await getJSON("https://api.coingecko.com/api/v3/coins");
            displayCoins(coins);
        }
        catch (err) {
            alert(err.message);
        }
    }

    function displayCoins(coins) {//Display all coins on home page/
        let content = "";
        for (const coin of coins) {
            const card = createCard(coin);
            content += card;
        }
        $("#homeSection").html(content);
    }

    function createCard(coin) {//Create card content. 
        const card = `
        <div class="card text-bg-info mb-3" style="max-width: 18rem;">
            <div class="card-header">
            <div class="form-check form-switch">
            <input class="form-check-input" type="checkbox" role="switch" data-id='${coin.symbol}' id="switch_${coin.id}">
            <label class="form-check-label" for="switch_${coin.id}"></label>
          </div>
            </div>
            ${coin.symbol}
            <h5 class="card-title"> ${coin.name}</h5>
            <img src="${coin.image.thumb}" class="card-text" /> <br>
                <button type="button" class="btn btn-warning" id="${coin.id}">More Info</button>
                <span id="moreInfoSpan"></span>
                <span id="loadingSpan"></span>
                </div>
            </div>
        </div>
        `;
        return card;
    }

    $("#dialog").dialog({
        autoOpen: false,
        modal: true
    });

    $("#homeSection").on("change", ".card input[type=checkbox]", function () {//Convert checked cards to array.
        const selectedId = $(this).data('id');

        if ($(this).prop('checked')) {
            // a. extract json string array from storage
            const oldStr = localStorage.getItem("array");
            // b. convert json string array into real array
            const oldArr = (oldStr === null) ? [] : JSON.parse(oldStr);
            // c. add new item into that array
            oldArr.push(selectedId);
            // d. convert that array into json string
            const newStr = JSON.stringify(oldArr);
            // e. save json string back to storage instead of previous array
            localStorage.setItem("array", newStr);
        }
        else {
            const oldStr = localStorage.getItem("array");
            const oldArr = (oldStr === null) ? [] : JSON.parse(oldStr);
            const index = oldArr.indexOf(selectedId);
            if (index > -1) { // Only splice array when item is found
                oldArr.splice(index, 1); // 2nd parameter means remove one item only
                const newStr = JSON.stringify(oldArr);
                localStorage.setItem("array", newStr);
            }
        }

        //Sending coins name from the local storage to 'createMiniCard' function
        const oldStr = localStorage.getItem("array");
        const oldArr = (oldStr === null) ? [] : JSON.parse(oldStr);
        const coin1 = createMiniCard(oldArr[0]);
        const coin2 = createMiniCard(oldArr[1]);
        const coin3 = createMiniCard(oldArr[2]);
        const coin4 = createMiniCard(oldArr[3]);
        const coin5 = createMiniCard(oldArr[4]);

        if (oldArr.length > 5) {//Popup window if more then 5 coins have been selected
            $("#dialog").dialog('open');
            $(".modal-body").html(`<h5>Please unselect one of the following coins in order to choose <b> "${oldArr[5]}"</b></h5>
             <span>${coin1}</span> <span>${coin2}</span> <span>${coin3}</span> <span>${coin4}</span> <span>${coin5}</span>`);
        };
    });
    $(".modal-body").on("change", ".popCard input[type=checkbox]", function () {
        const selectedId = $(this).data('id');
        if ($(this).prop('checked') == false) {//When unchecking the coins 
            const oldStr = localStorage.getItem("array");
            const oldArr = (oldStr === null) ? [] : JSON.parse(oldStr);
            const index = oldArr.indexOf(selectedId);//The index of the unchecked coin in the local storage
            $(`input[data-id=${selectedId}]`).prop('checked', false);//Uncheck the original coin
            if (index > -1) { // Only splice array when item is found
                oldArr.splice(index, 1); // Remove unchecked coin from local storage
                const newStr = JSON.stringify(oldArr);
                localStorage.setItem("array", newStr);
                $("#dialog").dialog('close');//Popup window closes after one of the coins unchecked
            }
        }

        else {//If the coin is checked again
            const oldStr = localStorage.getItem("array");
            const oldArr = (oldStr === null) ? [] : JSON.parse(oldStr);
            oldArr.unshift(selectedId);//Saving the checked coin back to the local storage
            const newStr = JSON.stringify(oldArr);
            localStorage.setItem("array", newStr);//Save json string back to storage instead of previous array
            $(`input[data-id=${selectedId}]`).prop('checked', true);//Check the original coin
        }
    });
});

$('#dialog').on('dialogclose', function () {
    const oldStr = localStorage.getItem("array");
    const oldArr = (oldStr === null) ? [] : JSON.parse(oldStr);
    if (oldArr.length > 5) {// If none of the coins have been unchecked
        $(`input[data-id=${oldArr[oldArr.length - 1]}`).prop('checked', false);//Check the original coin
        oldArr.pop(); // Remove sixth selected coin from local storage
        const newStr = JSON.stringify(oldArr);
        localStorage.setItem("array", newStr);
    }
});

function createMiniCard(name) {//Create card content. 
    const card = `
    <div class="popCard" >
      <div class="card-header">
        <div class="form-check form-switch">
         <input class="form-check-input" type="checkbox" role="switch" data-id='${name}' checked>
         <label class="form-check-label">
      </div>
        </div>
        <h5 class="card-title"> ${name}</h5>
            </div>
        </div>
    </div>
    `;
    return card;
}

//////// Live report //////
const oldStr = localStorage.getItem("array");
const oldArr = (oldStr === null) ? [] : JSON.parse(oldStr);

$.ajax({
    url: `https://min-api.cryptocompare.com/data/pricemulti?fsyms=${(oldArr[0])},
    ${(oldArr[1])},${(oldArr[2])},${(oldArr[3])},${(oldArr[4])}&tsyms=USD`,
    success: price => graph(price),
    error: err => alert(err.statusText)
});


function graph(price) {
    const dataPoints1 = [];
    const dataPoints2 = [];
    const dataPoints3 = [];
    const dataPoints4 = [];
    const dataPoints5 = [];
    const dataPoints = [dataPoints1, dataPoints2, dataPoints3, dataPoints4, dataPoints5];

    const options = {
        title: {
            text: "Current  price"
        },
        subtitles: [{
            text: "Click  on one of the currencies to hide his data "
        }],
        axisY: {
            suffix: "$"
        },
        toolTip: {
            shared: true
        },
        legend: {
            cursor: "pointer",
            verticalAlign: "top",
            fontSize: 22,
            fontColor: "dimGrey",
            itemclick: toggleDataSeries
        },
        data: [{
            type: "line",
            xValueType: "dateTime",
            yValueFormatString: "####.00$",
            xValueFormatString: "hh:mm:ss TT",
            showInLegend: true,
            name: oldArr[0],
            dataPoints: dataPoints1
        },
        {
            type: "line",
            xValueType: "dateTime",
            yValueFormatString: "####.00$",
            showInLegend: true,
            name: oldArr[1],
            dataPoints: dataPoints2
        }, {
            type: "line",
            xValueType: "dateTime",
            yValueFormatString: "####.00$",
            showInLegend: true,
            name: oldArr[2],
            dataPoints: dataPoints3
        },
        {
            type: "line",
            xValueType: "dateTime",
            yValueFormatString: "####.00$",
            showInLegend: true,
            name: oldArr[3],
            dataPoints: dataPoints4
        },
        {
            type: "line",
            xValueType: "dateTime",
            yValueFormatString: "####.00$",
            showInLegend: true,
            name: oldArr[4],
            dataPoints: dataPoints5
        }
        ]
    };
    const chart = $("#chartContainer").CanvasJSChart(options);

    function toggleDataSeries(e) {
        if (typeof (e.dataSeries.visible) === "undefined" || e.dataSeries.visible) {
            e.dataSeries.visible = false;
        }
        else {
            e.dataSeries.visible = true;
        }
        e.chart.render();
    }
    setInterval(function () {
        function updateChart() {
            let time = new Date;

            // pushing the new values
            let objectValuesCount = Object.values(price).length;

            for (let i = 0; i < objectValuesCount; i++) {
                dataPoints[i].push({
                    x: time.getTime(),
                    y: Object.values(price)[i].USD
                });
                options.data[i].legendText = oldArr[i] + " : " + Object.values(price)[i].USD + "$";
            }

        }
        $("#chartContainer").CanvasJSChart().render();

        updateChart();
    }, 2000);
}
async function getMoreInfo(coinId, spanCoin) {//Return coin current price from API.
    $(spanCoin).html(`<br><div class="spinner-border text-muted" id="spinner"></div>`);
    const coin = await getJSON("https://api.coingecko.com/api/v3/coins/" + coinId);
    return coin;
}

function getJSON(url) {//Get coin current price from API.
    return new Promise((resolve, reject) => {
        $.ajax({
            url,
            success: data => {
                resolve(data);
            },
            error: err => {
                reject(err);
            }
        })
    });
}
