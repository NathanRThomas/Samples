// Globals
var gInventoryStart     = 0;      //the start limit of the next callback
var gInventoryIncrement  = 50;      //the increment at which we want to scroll through looks
var searchTimeout       = null;
var gInventorySrollFlag = false;
var gPageLoaded = false;

//Anytime we need to search again from the beginning
function resetInventorySearch () {
    gInventoryStart = 0;
    getInventoryList();
}

function getInventoryList () {
    gInventorySrollFlag = true;

    if (gInventoryStart == 0)
        $j('#table tbody').html('Loading...');

    var attrList = search_GetFinalAttrList();   //populate a list of attributes

    $j.post('/ajax/blogger_ajax.php', {
        'statement' : 'getInventory',
        'start'     : gInventoryStart,
        'limit'     : gInventoryStart + gInventoryIncrement,
        'search'    : $j('#invSearch').val(),
        'attrList'  : attrList,
        'inventory' : $j('#inventoryCheckbox').is(':checked'),
        'unpublished' : $j('#unpublished').is(':checked'),
        'discontinued' : $j('#discontinued').is(':checked')
    },
    function (data) {
        if (data['success']) {   //this is good
            if (gInventoryStart == 0)
                $j('#table tbody').html('');

            var items = data['list'];
            
            if (items.length > 0) {
                for (var i=0; i < items.length; i++) {
                    if (i > 0 && items[i].item_id == items[i-1].item_id && items[i]['color'] == items[i-1]['color']){
                        //this is the same item but in a different size, so we don't want to create a new row.
                        $j('.inv-size:last').append('<div>' + items[i]['size'] + '</div>');
                        $j('.inv-sku:last').append('<div data-invID="' + items[i].inventory_id + '">' + items[i].sku + '&nbsp;</div>');
                        $j('.inv-qty:last').append('<div>' + items[i].stock_quantity + '</div>');

                        if (items[i].sku.length > 0)
                            $j('.inv-tag:last').append('<br/><span data-invID="' + items[i].inventory_id + '" class="glyphicon glyphicon-tag glyphicon-active gen-item-tag" title="Generate Item Tag"></span>');
                        else
                            $j('.inv-tag:last').append('<br/>');
                    }
                    else {
                        var content = '<tr data-id="' + items[i].item_id + '">';
                        content = content + '<td><img src="' + items[i].thumb_image_url + '" onclick="startItemDetail (' + items[i].item_id + 
                            ');" class="hover-pointer"/><td><span class="inv-name">' + 
                            items[i].item_name + '</span></td><td><span class="inv-brand">' + 
                            items[i].item_brand + '</span></td><td><span class="inv-color">' + 
                            items[i]['color'] + '</span></td><td><span>$' + 
                            items[i].price + '</span></td><td class="inv-size"><div>' + 
                            items[i]['size'] + '</div></td><td class="inv-sku"><div data-invID="' + items[i].inventory_id + '">' + 
                            items[i].sku + '&nbsp;</div></td>';

                        if ($j('#historyModal').length > 0)
                            content = content + '<td class="inv-qty"><div>' + items[i].stock_quantity + '</div></td>';

                        content = content + '<td class="inv-tag">';
                        if (items[i].sku.length > 0)
                            content = content + '<span data-invID="' + items[i].inventory_id + '" class="glyphicon glyphicon-tag glyphicon-active gen-item-tag" title="Generate Item Tag"></span>';
                        
                        content = content + '</td></tr>';
                        $j('#table tbody').append(content);
                    }
                }

                gInventorySrollFlag = false;    //we can do it again now
                gInventoryStart += i;
            }

            gPageLoaded = true;
        }
    });
}

function orderLinkClicked (sku) {
    $j('#historyModal').modal('hide');
    startViewOrder(sku);
}

function startHistoryModal (invID) {
    $j('#modalInvID').val(invID);   //set our hidden id
    $j('.history-body-modal').html('Loading...');

    $j.post('/ajax/admin_ajax.php', {
        'statement'     : 'getInventoryHistory',
        'inventoryID'   : invID,
    },
    function (data) {
        if (data['success']) {   //this is good
            var content = '<div class="row"><div class="col-sm-2" style="border-radius:50%;overflow:hidden"><img src="' + data.data[0].thumb_image_url + '" style="width:100%"></div>';

            content = content + '<div class="col-sm-2"><h6>SKU: <h5>' + data.data[0].sku + '</h5><br/><h5>' + data.data[0].color + 
                '</h5><br/>Size: <h5>' + data.data[0].size + '</h5></h6></div>';
            content = content + '<div class="col-sm-4"><h5>' + data.data[0].item_name + '<br/><p>By: </p><i>' + data.data[0].item_brand + 
                '</i></h5><br/><br/><p>' + data.data[0].item_detail + '</p></div>';
            content = content + '<div class="col-sm-2"><h5>' + data.data[0].item_year + '</h5><br/><h5>' + 
                data.data[0].item_season + '</h5></div>';

            content = content + '<div class="col-sm-2"><h5>' + data.data[0].owned + '<br/>';
            
            if (data.data[0].publish_flag == 1)
                content = content + 'Published';
            
            content = content + '</h5><br/>';

            if (data.data[0].wconcept_sku.length > 0)
                content = content + '<br/><h5> W-Concept Item<br/>' + data.data[0].wconcept_sku + '</h5>';

            content = content + '</div></div>';   //finish the row

            content = content + '<br/><div class="row"><div class="col-sm-2 col-sm-offset-2"><p>In Stock: </p><h5>' + data.data[0].stock_quantity + 
                '</h5><br/><p>In Cart: </p><h5>' + data.data[0].countCart + '</h5><br/><span class="hover-pointer" onClick="orderLinkClicked(' + "'" + 
                data.data[0].sku + "'" + ');"<p>Ordered: </p><h5>' + data.data[0].countOrdered + '</h5></div>';
            content = content + '<div class="col-sm-4"><p>Price: </p><h5>$' + data.price[0].price + '</h5>';

            var i = 1;
            while (data.price[i] != undefined) {
                content = content + '<br/><p>' + data.price[i].end_date + '</p>: <h5>$' + data.price[i].price + '</h5>';
                i++;
            }
            content = content + '</div></div>';    //end the row

            //vendor orders
            content = content + '<br/><br/><div class="row"><div class="col-sm-12"><h4>Vendor Orders:</h4><br/><table class="table table-hover table-condensed history-table-orders"><thead><tr>' + 
                        '<th>Date</th><th>Qty</th><th>Cost</th><th>Order #</th><th>Notes</th></tr></thead>';

            var i = 0;
            while (data.data[i] != undefined && data.data[i].orderedUnits != null) {    //all of our ordered units
                if (i == 0 || data.data[i].vendor_order_inventory_id != data.data[i-1].vendor_order_inventory_id)
                    content = content + '<tr data-id="' + data.data[i].vendor_order_inventory_id + '"><td class="non-edit">' + data.data[i].order_date + 
                        '</td><td class="edit-history"><input type="text" value="' + data.data[i].order_date + '" class="form-control edit-history-order-date"></td><td class="non-edit">' + 
                        data.data[i].orderedUnits + '</td><td class="edit-history"><input type="numeric" class="form-control edit-history-order-qty" min="0" value="' + 
                        data.data[i].orderedUnits + '"></td><td class="non-edit">' + data.data[i].wholesale_cost + 
                        '</td><td class="edit-history"><input type="numeric" class="form-control edit-history-order-cost" value="' + data.data[i].wholesale_cost + 
                        '"></td><td class="non-edit">' + data.data[i].order_number + '</td><td class="edit-history"><input type="text" class="form-control edit-history-order-number" value="' + 
                        data.data[i].order_number + '"></td><td class="non-edit">' + data.data[i].order_notes + 
                        '</td><td class="edit-history"><input type="text" class="form-control edit-history-order-notes" value="' + 
                        data.data[i].order_notes + '"></td></tr>';
                i++;
            }

            content = content + '</table></div></div>';

            //Removals
            content = content + '<br/><br/><div class="row"><div class="col-sm-12"><h4>Removals:</h4><br/><table class="table table-hover table-condensed history-table-removals"><thead><tr>' + 
                        '<th>Date</th><th>Qty</th><th>Reason</th><th>Result</th><th>Notes</th></tr></thead>';

            var i = 0;
            while (data.data[i] != undefined && data.data[i].removedUnits != null) {    //all of our removed units
                if (i == 0 || data.data[i].vendor_inventory_removal_id != data.data[i-1].vendor_inventory_removal_id) {
                    content = content + '<tr data-id="' + data.data[i].vendor_inventory_removal_id + '"><td class="non-edit">' + data.data[i].removal_date + 
                    '</td><td class="edit-history"><input type="text" value="' + 
                    data.data[i].removal_date + '" class="form-control edit-history-removal-date"></td><td class="non-edit">' + data.data[i].removedUnits + 
                    '</td><td class="edit-history"><input type="numeric" class="form-control edit-history-removal-qty" min="0" value="' + 
                    data.data[i].removedUnits + '"></td><td class="non-edit">' + data.data[i].reason_description + 
                    '</td><td class="edit-history"><select class="form-control edit-dropdown edit-history-removal-reason" data-defaultID="' + 
                    data.data[i].removal_reason_id + '">';

                    var j = 0;
                    while (data.reasons[j] != undefined) {
                        content = content + '<option value="' + data.reasons[j].removal_reason_id + '">' + data.reasons[j].reason_description + '</option>';
                        j++;
                    }

                    content = content + '</select></td><td class="non-edit">' + data.data[i].result_description + 
                    '</td><td class="edit-history"><select class="form-control edit-dropdown edit-history-removal-result" data-defaultID="' + 
                    data.data[i].removal_result_id + '">';

                    var j = 0;
                    while (data.results[j] != undefined) {
                        content = content + '<option value="' + data.results[j].removal_result_id + '">' + data.results[j].result_description + '</option>';
                        j++;
                    }

                    content = content + '</select></td><td class="non-edit">' + data.data[i].removal_notes + 
                    '</td><td class="edit-history"><input type="text" class="form-control edit-history-removal-notes" value="' + 
                    data.data[i].removal_notes + '"></td></tr>';
                }
                i++;
            }

            content = content + '</table></div></div>';

            //Removal Returns
            content = content + '<br/><br/><div class="row"><div class="col-sm-12"><h4>Removal Returns:</h4><br/><table class="table table-hover table-condensed history-table-returns"><thead><tr>' + 
                        '<th>Date</th><th>Qty</th><th>Notes</th><th></th><th></th></tr></thead>';

            var i = 0;
            while (data.data[i] != undefined && data.data[i].returnedUnits != null) {   //all of our returns
                if (i == 0 || data.data[i].vendor_inventory_return_id != data.data[i-1].vendor_inventory_return_id)
                    content = content + '<tr data-id="' + data.data[i].vendor_inventory_return_id + '"><td class="non-edit">' + data.data[i].return_date + 
                        '</td><td class="edit-history"><input type="text" class="form-control edit-history-return-date" value="' + 
                        data.data[i].return_date + '"></td><td class="non-edit">' + data.data[i].returnedUnits + 
                        '</td><td class="edit-history"><input type="numeric" min="0" class="form-control edit-history-return-qty" value="' + 
                        data.data[i].returnedUnits + '"></td><td class="non-edit">' + data.data[i].return_notes + 
                        '</td><td class="edit-history"><input type="text" class="form-control edit-history-return-notes" value="' + 
                        data.data[i].return_notes + '"></td></tr>';
                i++;
            }

            content = content + '</table></div></div>';

            //Blogger Checkouts
            content = content + '<br/><br/><div class="row"><div class="col-sm-12"><h4>Blogger Checkouts:</h4><br/><table class="table table-hover table-condensed history-table-bloggers"><thead><tr>' + 
                        '<th>Blogger</th><th>Checkout Date</th><th>Checkout Notes</th><th>Return Date</th><th>Return Notes</th></tr></thead>';

            var i = 0;
            while (data.bloggerCheckout[i] != undefined) {  //all of our blogger checkouts
            
                content = content + '<tr data-id="' + data.bloggerCheckout[i].blogger_inventory_id + '"><td class="non-edit">' + 
                    data.bloggerCheckout[i].display_name + 
                    '</td><td class="edit-history"><select class="form-control edit-dropdown edit-history-blogger-name" data-defaultID="' + 
                    data.bloggerCheckout[i].blogger_id + '">';

                var j = 0;
                    while (data.bloggers[j] != undefined) {
                        content = content + '<option value="' + data.bloggers[j].blogger_id + '">' + data.bloggers[j].display_name + '</option>';
                        j++;
                    }

                content = content + '</select></td><td class="non-edit">' + data.bloggerCheckout[i].checkout_date + 
                    '</td><td class="edit-history"><input type="text" class="form-control edit-history-blogger-checkout-date" value="' + 
                    data.bloggerCheckout[i].checkout_date + '"></td><td class="non-edit">' + data.bloggerCheckout[i].checkout_notes + 
                    '</td><td class="edit-history"><input type="text" class="form-control edit-history-blogger-checkout-notes" value="' + 
                    data.bloggerCheckout[i].checkout_notes + '"></td><td class="non-edit">' + data.bloggerCheckout[i].return_date + 
                    '</td><td class="edit-history"><input type="text" class="form-control edit-history-blogger-return-date" value="' + 
                    data.bloggerCheckout[i].return_date + '"></td><td class="non-edit">' + data.bloggerCheckout[i].return_notes + 
                    '</td><td class="edit-history"><input type="text" class="form-control edit-history-blogger-return-notes" value="' + 
                    data.bloggerCheckout[i].return_notes + '"></td></tr>';
                i++;
            }

            content = content + '</table></div></div>';

            $j('.history-body-modal').html(content);

            $j('.edit-dropdown').each(function () {
                $j(this).val($j(this).attr("data-defaultID"));  //this sets the dropdowns to the value they're supposed to be
            });
        }
        else {
            $j('#historyModal').modal('hide');
            alertify.error(data['msg']);
        }
    });
    
    $j('#historyModal').modal('show');
}

//when we need to manually update some part of the history of an inventory item
function saveEditedHistory () {
    var orders = [];
    var removals = [];
    var returns = [];
    var bloggers = [];

    $j('.history-table-orders tbody tr').each(function () { //populate our orders
        var tmp = {};
        tmp.id = $j(this).attr("data-id");
        tmp.date = $j(this).find('.edit-history-order-date').val();
        tmp.qty = $j(this).find('.edit-history-order-qty').val();
        tmp.cost = $j(this).find('.edit-history-order-cost').val();
        tmp.orderNumber = $j(this).find('.edit-history-order-number').val();
        tmp.notes = $j(this).find('.edit-history-order-notes').val();

        orders.push(tmp);
    });

    $j('.history-table-removals tbody tr').each(function () { //populate our removals
        var tmp = {};
        tmp.id = $j(this).attr("data-id");
        tmp.date = $j(this).find('.edit-history-removal-date').val();
        tmp.qty = $j(this).find('.edit-history-removal-qty').val();
        tmp.reason = $j(this).find('.edit-history-removal-reason').val();
        tmp.result = $j(this).find('.edit-history-removal-result').val();
        tmp.notes = $j(this).find('.edit-history-removal-notes').val();

        removals.push(tmp);
    });

    $j('.history-table-returns tbody tr').each(function () { //populate our removals
        var tmp = {};
        tmp.id = $j(this).attr("data-id");
        tmp.date = $j(this).find('.edit-history-return-date').val();
        tmp.qty = $j(this).find('.edit-history-return-qty').val();
        tmp.notes = $j(this).find('.edit-history-return-notes').val();

        returns.push(tmp);
    });

    $j('.history-table-bloggers tbody tr').each(function () { //populate our removals
        var tmp = {};
        tmp.id = $j(this).attr("data-id");
        tmp.bloggerID = $j(this).find('.edit-history-blogger-name').val();
        tmp.checkoutDate = $j(this).find('.edit-history-blogger-checkout-date').val();
        tmp.checkoutNotes = $j(this).find('.edit-history-blogger-checkout-notes').val();
        tmp.returnDate = $j(this).find('.edit-history-blogger-return-date').val();
        tmp.returnNotes = $j(this).find('.edit-history-blogger-return-notes').val();

        bloggers.push(tmp);
    });

    $j.post('/ajax/admin_ajax.php', {
        'statement'     : 'saveEditedHistory',
        'inventoryID'   : $j('#modalInvID').val(),
        'orders'        : orders,
        'removals'      : removals,
        'returns'       : returns,
        'bloggers'      : bloggers,
    },
    function (data) {
        if (data['success']) {   //this is good

            $j('#historyModal').modal('hide');
            
            $j('#cancelSaveHistory').hide();
            $j('#editHistory').show();
            $j('#saveHistory').hide();
            alertify.success(data['msg']);
        }
        else {
            setModalError(data['msg']);
        }
    });
}

//this is a callback from the generic attribute search function
function genericResetSearch () {
    if (gPageLoaded)
        resetInventorySearch();
}

//document ready
$j(document).ready(function () {

    $j('.creamCheckbox').on('click', 'h6', function () {
        $el = $j(this).closest('.creamCheckbox').find('.inv-checkbox');
        
        if ($el.is(':checked'))
            $el.prop('checked', false);
        else
            $el.prop('checked', true);
        resetInventorySearch();
    });

    $j('#invSearch').keyup(function () {
        if (searchTimeout != null)
            window.clearTimeout(searchTimeout);

        searchTimeout = setTimeout(function () {
            resetInventorySearch();
        }, 400);
    });

    $j('.clear-search').click(function () {
        $j(this).closest('.search-group').find('input').val('');
        resetInventorySearch();
    });

    $j('#table tbody').on('click', 'span.gen-item-tag', function () {
        var list = [];
        list.push($j(this).attr("data-invID"));
        generateTagPage(list);
    });

    $j('#table tbody').on('click', 'td.inv-sku div', function () {
        if ($j('#historyModal').length > 0 && $j(this).html().length > 7)
            startHistoryModal($j(this).attr("data-invID"));
    });

    $j('.inv-checkbox').change(function () {
        resetInventorySearch();
    });

    $j('#generateAllTags').click (function () {
        var list = [];
        $j('#table tbody').find('.gen-item-tag').each(function () {
            list.push($j(this).attr("data-invID"));
        });
        generateTagPage(list);
    });

    $j('#editHistory').on("click", function () {
        $j('.non-edit').fadeOut('fast', function () {
            $j('.edit-history').fadeIn('fast');
        });

        $j(this).fadeOut('fast', function () {
            $j('#saveHistory').fadeIn('fast');
            $j('#cancelSaveHistory').fadeIn('fast');
        });
    });

    $j('#saveHistory').on("click", function () {
        saveEditedHistory();
    });

    $j('#cancelSaveHistory').on("click", function () {
        $j('.edit-history').fadeOut('fast', function () {
            $j('.non-edit').fadeIn('fast');
        });

        $j(this).fadeOut('fast', function () {
            $j('#editHistory').fadeIn('fast');
        });
        $j('#saveHistory').fadeOut('fast');
    });

    $j('.attr-wrapper').on("change", '.attr-dropdown', function () {
        search_UpdateAttributeSearch();
    });
    
    gInventorySrollFlag = true;
    getInventoryList();
    search_UpdateAttributeSearch();

    $j(window).unbind('scroll');
    $j(window).scroll(function () {   //handle scrolling down and showing more items
        if (gInventorySrollFlag == false) {
            if ($j('#rightContainer').is(":visible")) {
                if ($j(window).scrollTop() + 2 * ($j(window).height()) >=
                    $j(document).height())
                {
                    getInventoryList();
                }
            }
        }
    }); 
});