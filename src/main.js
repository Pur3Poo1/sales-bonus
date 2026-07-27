/**
 * Функция для расчета выручки
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _product) {
   // @TODO: Расчет выручки от операции
   const discount = 1 - (purchase.discount / 100);
   return purchase.sale_price * purchase.quantity * discount;
}

/**
 * Функция для расчета бонусов
 * @param index порядковый номер в отсортированном массиве
 * @param total общее число продавцов
 * @param seller карточка продавца
 * @returns {number}
 */
function calculateBonusByProfit(index, total, seller) {
    // @TODO: Расчет бонуса от позиции в рейтинге
    if (index === 0){
        return 150;
    } else if ( index === 1 || index === 2) {
        return 100;
    } else if (index === total - 1){
        return 0;
    } else {
        return 50;
    }
}

/**
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */
function analyzeSalesData(data, options) {

    // @TODO: Проверка входных данных
    if (!data
        || !Array.isArray(data.sellers)
        || data.sellers.length === 0
        || data.purchase_records.length === 0
    ) {
        throw new Error ("Некорректные входные данные");
    }

    // @TODO: Проверка наличия опций
    const { calculateRevenue, calculateBonus} = options;
        if (typeof calculateRevenue !== "function"
            || typeof calculateBonus !== "function"
    ) {
        throw new Error ("Некорректные входные данные");
    }

    // @TODO: Подготовка промежуточных данных для сбора статистики
    const sellerStats = data.sellers.map(seller =>{
        return seller
    })

    // @TODO: Индексация продавцов и товаров для быстрого доступа ШАГ4
    const sellerIndex = Object.fromEntries(sellerStats.map(item => [item.id, item]));
    const productIndex = Object.fromEntries(data.products.map(item => [item.sku, item]));

    // @TODO: Расчет выручки и прибыли для каждого продавца
    data.purchase_records.forEach( record => {
        const seller = sellerIndex[record.seller_id];
        if (seller.sales_count === undefined){
            seller.sales_count = 0;
        }
        seller.sales_count++;

        if (seller.revenue === undefined){
            seller.revenue = 0;
        }
        //seller.revenue += record.total_amount;

        if (!seller.products_sold){
            seller.products_sold = {};
        }

        record.items.forEach(item => {
            const product = productIndex[item.sku];
            product.cost = product.purchase_price * item.quantity;

            product.revenue = calculateRevenue(item, product);
            if (seller.profit === undefined){
                seller.profit = 0;
            }

            seller.revenue += product.revenue
            seller.profit += product.revenue - product.cost;
            // Увеличить число всех проданных товаров у продавца на количество проданных товаров в конкретном чеке
            if (seller.products_sold[item.sku] === undefined) {
                seller.products_sold[item.sku] = 0;
            }
            seller.products_sold[item.sku] += item.quantity;
        })
    })

    // @TODO: Сортировка продавцов по прибыли
    sellerStats.sort((a,b) => b.profit - a.profit)
    // @TODO: Назначение премий на основе ранжирования
    sellerStats.forEach((seller, index) => {
        seller.bonus = calculateBonus(index, sellerStats.length, seller)*seller.profit / 1000;
        seller.top_products = Object.entries(seller.products_sold)
            .map(product => {return {sku: product[0], quantity: product[1]}})
            .sort((a,b) => b.quantity - a.quantity).slice(0,10);
    });
    // @TODO: Подготовка итоговой коллекции с нужными полями
    return sellerStats.map(seller => ({
        seller_id: seller.id,
        name: seller.first_name + " " + seller.last_name,
        revenue: Number(seller.revenue.toFixed(2)),
        profit: Number(seller.profit.toFixed(2)),
        sales_count: seller.sales_count,
        top_products: seller.top_products,
        bonus: Number(seller.bonus.toFixed(2))
    }));
}

