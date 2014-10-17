/*! \file search.js
    \brief Pulled generic functions related to populating the attribute list for items of clothing.
    Any js using this needs to have its own genericResetSearch function declared, which should reset the dynmaically populated list of search results
*/

//returns list of all attributes selected by the user, used for ajax callbacks
function search_GetFinalAttrList () {
    var attrList = '';
    $j('.attr-wrapper').find('div.row').each(function () {
        if ($j(this).find('.attr-dropdown:last').val() > 0)    //they're on all
            attrList = attrList + ($j(this).find('.attr-dropdown:last').val() + ',');
        else if ($j(this).find('.attr-dropdown:last').attr('data-parentID') > 0)
            attrList = attrList + ($j(this).find('.attr-dropdown:last').attr('data-parentID') + ',');
    });

    if (attrList.length > 1)
        attrList = attrList.substring(0, attrList.length - 1);
    return attrList;
}

//called whenever an attribute list changes so we can repopulate the child list(s)
function search_UpdateAttributeSearch() {
    $list = $j('.attr-wrapper').find('div.row');
    
    if ($list.length == 0) {    //first time through
        $j('.attr-wrapper').append('<div class="row"><div class="col-sm-3 dropdown-parent"><select class="form-control attr-dropdown" data-parentID="0">\
            </select></div></div>');
        search_PopulateDropdown(0, 0);
    }
    else {
        $list.each(function () {    //go through each row
            var row = $j(this).index();
            $j(this).find('.dropdown-parent').each(function () {   //go through each select in the row
                if ($j(this).find('select').val() == 0){ //we're done at this point, no more selects
                    
                    if ($j(this).index() == 0)
                        $j(this).parent().remove(); //remove the whole row
                    else
                        $j(this).parent().find('.dropdown-parent:gt(' + $j(this).index() + ')').remove();   //remove just the remaining items
                    
                }
                else {  //we need another dropdown
                    $next = $j(this).next();
                    var removeFlag = false;
                    
                    if ($next.find('.attr-dropdown').attr('data-parentID') != $j(this).find('.attr-dropdown').val()) {
                        $j(this).parent().find('.dropdown-parent:gt(' + $j(this).index() + ')').remove();   //remove just the remaining dropdowns
                        removeFlag = true;
                    }

                    if (removeFlag || $next.find('.attr-dropdown').length == 0) { //we need to add another dropdown with the parent's id
                        var parent = $j(this).find('select').val();
                        $j(this).parent().append('<div class="col-sm-3 dropdown-parent" style="display:none"><select class="form-control attr-dropdown" data-parentID="' + 
                            parent + '"></select></div>');

                        search_PopulateDropdown(parent, row);
                    }
                }
            });
        });
    }

    search_PopulateFinalDropdown ();
}

function search_PopulateDropdown(parent, row) {
    var locRow = row;

    $j.post('/ajax/blogger_ajax.php', {
        'statement' : 'getAttribute',
        'parent'    : parent,
    },
    function (data) {
        if (data['success']) {   //this is good
            $obj = $j('.attr-wrapper').find('.row:eq(' + locRow + ')');
            if (data.options == undefined) {
                $obj.find('.dropdown-parent:last').remove();
            }
            else {
                $el = $obj.find('.attr-dropdown:last');

                var i = 0;
                $el.html('<option value="0">All</option>');
                while (data.options[i] != undefined) {
                    //console.log(data.options[i].attribute_id);
                    $el.append('<option value="' + data.options[i].attribute_id + '">' + data.options[i].attribute_name + '</option>');
                    i++;
                }

                $obj.find('.dropdown-parent:last').fadeIn('fast');

                if ($el.attr('data-parentID') == 0)
                    genericResetSearch(); //do the search again
            }

            search_PopulateFinalDropdown ();
        }
    });
}

function search_PopulateFinalDropdown () {
    if($j('.attr-wrapper').find('div.row:last').find('.attr-dropdown').length == 0 ||
        $j('.attr-wrapper').find('div.row:last').find('.attr-dropdown:first').val() > 0) {
        $j('.attr-wrapper').append('<div class="row"><div class="col-sm-3 dropdown-parent"><select class="form-control attr-dropdown"\
            data-parentID="0"></select></div></div>');

        search_PopulateDropdown(0, $j('.attr-wrapper').find('div.row:last').index());
    }   
}