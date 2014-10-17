<?php
/*! \file filter.php
 *  \brief Heart and sole of this whole mifilter thing.
 *  This is the second version of this class.  I've learned a few things, plus I'm using pre-calculated fields in the database now
*/

class miFilter {

  //---------------------------------------------------------------------------------------------------------------//
 //----- CONSTANTS -----------------------------------------------------------------------------------------------//
//---------------------------------------------------------------------------------------------------------------//
    
    //these must add up to 100
    const WEIGHT_CAT_TAGS           = 20;
    const WEIGHT_POST_AGE           = 20;
    const WEIGHT_KEYWORDS           = 30;
    const WEIGHT_CUSTOMER_RATE      = 20;
    const WEIGHT_CLIENT_RATE        = 10;
    
    //speed levels
    const SPEED_REAL_TIME           = 1;
    const SPEED_THOROUGH            = 2;
    const SPEED_DEBUG               = 3;

  //---------------------------------------------------------------------------------------------------------------//
 //----- PRIVATE VARIABLES ---------------------------------------------------------------------------------------//
//---------------------------------------------------------------------------------------------------------------//
    
    private $miDB;      ///< Local database instance
    private $level;     ///< Local to indicate the speed and thoroughness of the recommendation
    
    private $customerID;    ///< ID of the customer we're filtering for
    private $groupID;       ///< ID of the group we're filtering for
    private $clientID;      ///< ID of the client we're filtering for

  //---------------------------------------------------------------------------------------------------------------//
 //----- PRIVATE FUNCTIONS ---------------------------------------------------------------------------------------//
//---------------------------------------------------------------------------------------------------------------//

    function __construct($database, $l = 0) {
        $this->miDB = $database;
        
        switch($l) {
            case miFilter::SPEED_DEBUG:
            case miFilter::SPEED_THOROUGH:
                $this->level = $l;
                break;
            
            case miFilter::SPEED_REAL_TIME: //we'll make the fast one the default
            default:
                $this->level = miFilter::SPEED_REAL_TIME;
                break;
        }
    }
    
    /*! \fn _setLocalIds ($customerID = 0, $groupID = 0, $clientID = 0)
     *  \brief Stores locally info about who and what we're filtering
    */
    function _setLocalIds ($customerID = 0, $groupID = 0, $clientID = 0) {
        $this->customerID = $customerID;
        $this->groupID = $groupID;
        $this->clientID = $clientID;
    }

  //---------------------------------------------------------------------------------------------------------------//
 //----- PRIVATE DATABASE ----------------------------------------------------------------------------------------//
//---------------------------------------------------------------------------------------------------------------//

//----- Public function calls -------------------------------------------------------------------------------------//
    
    /*! \fn getGroupTags ($groupID)
     *  \brief Gets an array of all the tag words for a group based on the default categories it's associated with
    */
    private function _db_getGroupTags ()
    {
        $sql = "SELECT ct.tag_id
                FROM mi_group_category gc
                INNER JOIN mi_category_tag ct ON ct.category_id = gc.category_id
                WHERE gc.group_id = :id AND gc.deleted = 0 AND ct.deleted = 0";
        
        return ($this->miDB->executeReadSlaveQuery($sql, array(':id'=>$this->groupID)));
    }
    
    /*! \fn getClientTags ()
     *  \brief Gets an array of all the tag words for a client based on the default categories they're associated with
    */
    private function _db_getClientTags () {
        $sql = "SELECT ct.tag_id
                FROM mi_client_category cc
                INNER JOIN mi_category_tag ct ON ct.category_id = cc.category_id
                WHERE cc.client_id = :id AND cc.deleted = 0 AND ct.deleted = 0";
        
        return ($this->miDB->executeReadSlaveQuery($sql, array(':id'=>$this->clientID)));
    }
    
    /*! \fn _db_updateGroupPostRecommend ($list)
     *  \brief Updates the group with their own comma delimited list of posts
    */
    private function _db_updateGroupPostRecommend ($list)
    {
        $sql = "UPDATE mi_group SET post_recommendation = :posts WHERE group_id = :id";
        
        return ($this->miDB->executeWriteQuery($sql, array(':posts'=>$list, ':id'=>$this->groupID)));
    }
    
    /*! \fn _db_updateClientPostRecommend ($list)
     *  \brief Updates the client with their own comma delimited list of posts
    */
    private function _db_updateClientPostRecommend ($list)
    {
        $sql = "UPDATE mi_client SET post_recommendation = :posts WHERE client_id = :id";
        
        return ($this->miDB->executeWriteQuery($sql, array(':posts'=>$list, ':id'=>$this->clientID)));
    }
    
    /*! \fn _db_getGroupFromID ($groupID)
        \brief Gets the tagwords for a specific group
    */
    private function _db_getGroupFromID ($groupID) {
        $sql = "SELECT tagwords, customer_id FROM mi_group WHERE group_id = :id";
        
        $result = $this->miDB->executeReadSlaveQuery($sql, array(':id'=>$groupID));
        
        if (isset($result[0]))
            return $result[0];
        else
            return false;
    }
    
    /*! \fn _db_getClientFromID ($clientID)
     *  \brief Gets info about a client from their id
    */
    private function _db_getClientFromID ($clientID) {
        $sql = "SELECT customer_id, tagwords FROM mi_client WHERE client_id = :id";
        
        $result = $this->miDB->executeReadSlaveQuery($sql, array(':id'=>$clientID));
        
        if (isset($result[0]))
            return $result[0];
        else
            return false;
    }
        
    /*! \fn _db_getTagFromNameArray($nameArray)
     *  \brief Gets an array of tag_id's from the tag_names.  Expects a comma delimited string
    */
    private function _db_getTagFromNameArray($nameArray) {
        $names = explode(',', $nameArray);
        $list = '';
        foreach($names as $name) {
            $list .= $name. "','";
        }
        
        $list = "'". substr($list, 0, -2);   //remove the last ,'
        
        $sql = "SELECT tag_id FROM mi_tag WHERE tag_name IN (". $list. ")";
        
        return ($this->miDB->executeReadSlaveQuery($sql));
    }
    
//----- Private Function Calls -------------------------------------------------------------------------------------//
    
    /*! \fn _db_getPostsFromTags ($tagArray, $limit = 50)
     *  \brief Gets a list of posts as well as their final weights based on this array of tag words
    */
    private function _db_getPostsFromTags ($tagArray, $limit = 100) {
        if (count($tagArray) == 0 || $tagArray == 0)
            return false;
        
        $list = '';
        foreach($tagArray as $tag)
            $list .= $tag['tag_id']. ',';
        
        $list = substr($list, 0, -1);   //remove the last comma
        
        $sql = "SELECT post_id, SUM(final_weight) as fWeight FROM mi_post_tag 
                WHERE tag_id IN (". $list. ") GROUP BY post_id ORDER BY fWeight DESC LIMIT ". $limit;
                
        return ($this->miDB->executeReadSlaveQuery($sql));
    }
    
    /*! \fn _db_getPostsByAge ($limit = 50)
     *  \brief Gets a list of the newest posts and their age in days
    */
    private function _db_getPostsByAge ($limit = 100) {
        $sql = "SELECT post_id, DATEDIFF(now(), post_date) as daysOld FROM mi_post WHERE deleted = 0 ORDER BY post_id DESC LIMIT " . $limit;
        return ($this->miDB->executeReadSlaveQuery($sql));
    }

    /*! \fn _db_getCustomerRatedPostsByRating ($ratingID)
     *  \brief Gets a list of posts that a customer has rated based on the rating
     *  3 = thumbs down
    */
    private function _db_getCustomerRatedPostsByRating ($ratingID) {
        $sql = "SELECT post_id FROM mi_post_rated WHERE customer_id = :customerID AND rating_id = :ratingID";
        return ($this->miDB->executeReadSlaveQuery($sql, array(':customerID'=>$this->customerID, ':ratingID'=>$ratingID)));
    }
    
    /*! \fn _db_getCustomerRatedPosts
     *  \brief Gets all rated posts by this customer.  This is because we don't want to recommend anything they've engaged in again
    */
    private function _db_getCustomerRatedPosts () {
        $sql = "SELECT post_id FROM mi_post_rated WHERE customer_id = :customerID";
        return ($this->miDB->executeReadSlaveQuery($sql, array(':customerID'=>$this->customerID)));
    }
    
  //---------------------------------------------------------------------------------------------------------------//
 //----- PRIVATE FILTERS -----------------------------------------------------------------------------------------//
//---------------------------------------------------------------------------------------------------------------//
    
    private function _filterPosts ($keywordPostArray = 0, $catPostArray = 0, $limit = 28) {
        $postList = '';
        
        $catPosts = $this->_db_getPostsFromTags ($catPostArray); //do the category tag words
        $keywordPosts = $this->_db_getPostsFromTags($keywordPostArray); //do the category tag words
        
        $agePosts = $this->_db_getPostsByAge ();
        
        if ($keywordPostArray == 0 || count($keywordPostArray) == 0) //we don't have any keywords
            $catWeight = miFilter::WEIGHT_CAT_TAGS + miFilter::WEIGHT_KEYWORDS;
        else
            $catWeight = miFilter::WEIGHT_CAT_TAGS;
        
        if ($catPostArray == 0 || count($catPostArray) == 0) //we don't have any category keywords
            $keyWeight = miFilter::WEIGHT_CAT_TAGS + miFilter::WEIGHT_KEYWORDS;
        else
            $keyWeight = miFilter::WEIGHT_KEYWORDS;
        
        $finalArray = array();  //combine our results into a final list
        
        $this->_nodePostAge($agePosts); //weight the posts by age
        $this->_nodePostTag($catPosts, $catWeight);
        $this->_nodePostTag($keywordPosts, $keyWeight);
        
        //we're going to create an array, where the key is the post id so we can find it quickly later
        foreach($agePosts as $post) {   //start with the post ages
            $finalArray[$post['post_id']] = $post['fWeight'];   
        }
        
        //category tag words
        if ($catPosts != 0 && count($catPosts) > 0) {
            foreach($catPosts as $post) {
                if (isset($finalArray[$post['post_id']]))
                    $finalArray[$post['post_id']] += $post['fWeight'];
                else
                    $finalArray[$post['post_id']] = $post['fWeight'];   
            }
        }
        
        //keyword tag words
        if ($keywordPosts != 0 && count($keywordPosts) > 0) {
            foreach($keywordPosts as $post) {
                if (isset($finalArray[$post['post_id']]))
                    $finalArray[$post['post_id']] += $post['fWeight'];
                else
                    $finalArray[$post['post_id']] = $post['fWeight'];   
            }
        }
        
        //remove any posts we don't want
        $removeList = $this->_db_getCustomerRatedPosts(); //all posts the user has interacted with
        foreach($removeList as $r) {
            if (isset($finalArray[$r['post_id']]))
                unset($finalArray[$r['post_id']]);
        }
        
        //we've added all the scores, now sort by the weight
        arsort($finalArray);
        
        if (count($finalArray) < $limit)    //make sure we got enough posts for our limit
            $limit = count($finalArray);
        
        foreach($finalArray as $id=>$weight) {
            $postList .= $id. ',';
            $limit--;
            if ($limit <= 0)
                break;  //we're done
        }
        
        return $postList;   //we're done, return what we got
    }
    
//----- NODES -----------------------------------------------------------------------------------------------------//

    /*! \fn _nodePostAge (&$postList)
     *  \brief Goes through and weights the posts based on their age.  This is a pretty aggressive function that gives no weight after 15 days
    */
    private function _nodePostAge (&$postList) {
        $limit = count($postList);
        for ($i = 0; $i < $limit; $i++) {
            $score = 1.1 - sqrt(log10(0.5 * $postList[$i]['daysOld']));
            if ($score < 0)
                $score = 0;
            else if ($score > 1)
                $score = 1;
                
            $postList[$i]['fWeight'] = $score * miFilter::WEIGHT_POST_AGE;
        }
    }
    
    /*! \fn _nodePostTag (&$postList, $weight)
     *  \brief Applies weighting to posts based on tag word scores
    */
    private function _nodePostTag (&$postList, $weight) {
        $limit = count($postList);
        if ($limit == 0 || !isset($postList[0]))
            return;
        
        $topScore = $postList[0]['fWeight'];    //record our top score
        for ($i = 0; $i < $limit; $i++) {
            $score = cos(2 * (1-($postList[$i]['fWeight'] / $topScore)));   //simple cos for right now
            if ($score < 0)
                $score = 0;
            else if ($score > 1)
                $score = 1;
            
            $postList[$i]['fWeight'] = $score * $weight;
        }
    }
    
  //---------------------------------------------------------------------------------------------------------------//
 //----- PUBLIC FUNCTIONS ----------------------------------------------------------------------------------------//
//---------------------------------------------------------------------------------------------------------------//

    /*! \fn processGroup($groupID)
     *  \brief This will generate a list of recommended posts for a group
    */
    function processGroup($groupID) {
        $groupInfo = $this->_db_getGroupFromID($groupID);   //get the tag words for this group
        $this->_setLocalIds($groupInfo['customer_id'], $groupID);
        
        if (strlen($groupInfo['tagwords']) > 0)  //we have something here
            $keywordList = $this->_db_getTagFromNameArray($groupInfo['tagwords']);
        else
            $keywordList = array();   //no tag words for this group
        
        $catTags = $this->_db_getGroupTags();    //get a list of the tag words associated with the default categories for this group
        
        if (count($catTags) == 0 && count($keywordList) == 0)   //we don't have anything to go on, so leave this one empty for now
            return;
        
        $postList = $this->_filterPosts ($keywordList, $catTags);  //do the work
        
        $this->_db_updateGroupPostRecommend($postList);  //post list generated, update the db
    }
    
    /*! \fn processClient($clientID)
     *  \brief This will generate a list of recommended posts for a group
    */
    function processClient($clientID) {
        $clientInfo = $this->_db_getClientFromID ($clientID);   //get the tag words for this group
        
        $this->_setLocalIds($clientInfo['customer_id'], 0, $clientID);
        
        if (strlen($clientInfo['tagwords']) > 0)  //we have something here
            $keywordList = $this->_db_getTagFromNameArray($clientInfo['tagwords']);
        else
            $keywordList = array();   //no tag words for this group
        
        $catTags = $this->_db_getClientTags();    //get a list of the tag words associated with the default categories for this group
        
        if (count($catTags) == 0 && count($keywordList) == 0)   //we don't have anything to go on, so leave this empty
            return;
        
        $postList = $this->_filterPosts ($keywordList, $catTags);  //do the work
        
        $this->_db_updateClientPostRecommend ($postList);  //post list generated, update the db
    }
    
    /*! \fn search ($words)
     *  \brief Used to search for posts based on a string of words.
     *  Words seperated with a space will be broken into single tag words as well as multi word tag words.
     *  Any punctiation will break the tag word up.
    */
    function search ($words, $customerID = 0) {
        $this->_setLocalIds($customerID);
        $finalString = '';
        $wordArray = preg_split ('/[^a-zA-Z\d\s:]/', $words, 0, PREG_SPLIT_NO_EMPTY);
        
        foreach($wordArray as $word) {
            $tmp = preg_split('/\s+/', $word, 0, PREG_SPLIT_NO_EMPTY);
            $i = 0;
            while (isset($tmp[$i])) {
                $finalString .= $tmp[$i]. ',';
                if (isset($tmp[$i+1]))
                    $finalString .= $tmp[$i]. ' '. $tmp[$i+1]. ',';
                if (isset($tmp[$i+2]))
                    $finalString .= $tmp[$i]. ' '. $tmp[$i+1]. ' '. $tmp[$i+2]. ',';
                    
                $i++;
            }
        }
        
        $searchList = $this->_db_getTagFromNameArray($finalString);   //get this list of tag id's
        
        $postList = $this->_filterPosts ($searchList);  //do the work
        if (strlen($postList) > 0)
            return substr($postList, 0, -1);
        else
            return $postList;
    }
    
}
?>