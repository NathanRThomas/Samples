<?php
/*! \file db.php
 *  \brief Contains generic class for communication with a database in php
 *      This should be used to build upon for other projects

Modifications:
2014-02-02  NT  Created
2014-09-22  NT  Added in memcached for slave query reads
----------------------------------------------------------------------------------*/

require (__DIR__. '/alzheimers.php');

class NEDB {

  //--------------------------------------------------------------------------------------------------------------------------------//
 //----- Public Variables ---------------------------------------------------------------------------------------------------------//
//--------------------------------------------------------------------------------------------------------------------------------//
    const ERR_EXECUTE_QUERY         = -1;       ///< There was an error executing a read query

    const DB_TYPE_MYSQL             = 1;
    const DB_TYPE_ORACLE            = 2;

  //--------------------------------------------------------------------------------------------------------------------------------//
 //----- Private Variables --------------------------------------------------------------------------------------------------------//
//--------------------------------------------------------------------------------------------------------------------------------//
    private $dbMaster;      ///< Default write connection
    private $dbRead;        ///< Default reading/slave database connection
    private $dbType;        ///< Holds the type of database we're talking to
    private $alz;           ///< Used for caching of slave read queries
    
    private $lastErrorCode      = 0;
    private $lastErrorMsg       = '';
    private $lastQuery          = '';   ///< Keeps track of the last query if we had an error
    
  //--------------------------------------------------------------------------------------------------------------------------------//
 //----- Private Functions ---------------------------------------------------------------------------------------------------------//
//--------------------------------------------------------------------------------------------------------------------------------//

    function __construct($host = null, $dbname = null, $username = 'root', $password = 'root', $dbType = 1) {
        
        //verify we have a host to connect to
        if ($host == null) {
            throw new Exception("Host cannot be null");
            return false;
        }
        else if ($dbname == null) {
            throw new Exception("Database Name must be specified");
            return false;
        }
        
        //set our default read and write databases
        switch ($dbType) {
            case NEDB::DB_TYPE_MYSQL:
            default:
                $this->dbRead = $this->dbMaster = $this->setDBConn ($host, $dbname, $username, $password);
                $this->dbType = NEDB::DB_TYPE_MYSQL;
                break;

            case NEDB::DB_TYPE_ORACLE:
                $this->dbRead = $this->dbMaster = $this->setOracleConn ($host, $dbname, $username, $password);
                $this->dbType = NEDB::DB_TYPE_ORACLE;
                break;
        }
        
        $this->alz = new ALZHEIMERS();  //create our cache
    }
    
    function __destruct () {
        $this->dbMaster = null; // i *think* this is all that's required to close the connection
        $this->dbRead = null;
    }
    
    /*! \fn setDBConn (&$dbConn, $host, $dbname, $username, $password)
     *  \brief Used to set a connection to a database handle
     *  \param &$dbConn - pointer to the database connection handle we want to set
    */
    private function setDBConn ($host, $dbname, $username, $password) {
        $conn = "mysql:host=". $host. ";dbname=". $dbname. ";charset=utf8";
        //$conn = "mysql:host=". $host. ";dbname=". $dbname;
        //now try to connect
        try {
            return (new PDO($conn, $username, $password));
        }
        catch (PDOException $e) {
            //throw new Exception($e->getMessage());
        }
        return false;
    }
    
    /*! \fn setOracleConn ($host, $dbname, $username, $password)
        \brief Used for talking to an oracle database.  The selects need to be different as well
    */
    private function setOracleConn ($host, $dbname, $username, $password) {
        $conn = "//". $host. ":2421/". $dbname;
        //now try to connect
        try {
            return (oci_connect ($username , $password, $conn));
            //return (new PDO($conn, $username, $password));
        }
        catch (PDOException $e) {
            throw new Exception($e->getMessage());
            //throw new Exception($e->message);
        }
        return false;
    }
    
    /*! \fn fetchReadQuery ($stmt, $vars)
     *  \brief Finishes up the executing and reading of the data from the query
    */
    private function fetchReadQuery ($stmt, $vars, $query = '') {
        if ($stmt->execute($vars))  //execute our statement with the vars
        {
            $result = $stmt->fetchall();    //get all the rows
            $stmt->closeCursor();                 //close the cursor cause we're done
        }
        else {
            $this->setLastError ($stmt, $query);    //record the error locally
            $result = NEDB::ERR_EXECUTE_QUERY;
        }
        
        return $result; //done
    }
    
    /*! \fn fetchOracleQuery ($stmt)
     *  \brief Returns the result array from an oracle based query
    */
    private function fetchOracleQuery ($stmt, $vars) {
        if (is_array($vars)) {
            foreach ($vars as $key=>$val) {
                oci_bind_by_name($stmt, $key, $val);
            }
        }
        
        oci_execute($stmt); //execute it here
        $rows = oci_fetch_all($stmt, $res, null, null, OCI_FETCHSTATEMENT_BY_ROW); //fetch everything
        oci_free_statement($stmt);  //free it now
        return $res;
    }

    /*! \fn setLastError ($stmt)
     *  \brief Records information about the last error that occured.
     *  Used for when we want to pass this information back up
    */
    private function setLastError ($stmt, $query = '')
    {
        $this->lastQuery = $query;
        $error = $stmt->errorInfo();
        if (isset($error[0]))
        {
            $this->lastErrorCode = $error[1];
            $this->lastErrorMsg = $error[2];
        }
    }

  //--------------------------------------------------------------------------------------------------------------------------------//
 //----- Public ---Functions ------------------------------------------------------------------------------------------------------//
//--------------------------------------------------------------------------------------------------------------------------------//
    
    /*! \fn startTransaction
     *  \brief Used when we need several inserts or updates to happen together.  If you call this,
     *  you must then call commit or rollback before the handle is lost
    */
    function startTransaction ()
    {
        $this->dbMaster->beginTransaction();
    }
    
    /*! \fn commitTransaction ()
     *  \brief Used to finish a transaction when we're happy with the data and the result.
    */
    function commitTransaction ()
    {
        $this->dbMaster->commit();
    }
    
    /*! \fn rollbackTransaction ()
     *  \brief If we have an issue with the database changes after we started a transaction, this can be used to undo the changes
    */
    function rollbackTransaction ()
    {
        $this->dbMaster->rollBack();
    }
    
    /*! \fn safeString ($string)
     *  \brief Used as a replacement for the pdo safe string
    */
    function safeString ($string)
    {
        return $this->dbMaster->quote($string);
    }
    
    /*! \fn setReadDBConn ($host = null, $dbname = null, $username = 'root', $password = 'root')
     *  \brief If we want to set the read or slave database to another connection
    */
    function setReadDBConn ($host = null, $dbname = null, $username = 'root', $password = 'root')
    {
        $this->dbRead = $this->setDBConn ($host, $dbname, $username, $password);
    }

  //--------------------------------------------------------------------------------------------------------------------------------//
 //----- Protected Functions ------------------------------------------------------------------------------------------------------//
//--------------------------------------------------------------------------------------------------------------------------------//
    
    /*! \fn executeWriteQuery ($query, $vars)
     *  \brief Executes a write query to our master db
    */
    protected function executeWriteQuery ($query, $vars = null) {
        $stmt = $this->dbMaster->prepare($query);   //prepare our query
        $result = $stmt->execute($vars);             //execute the prepared query
        
        if ($result)    //if we're good, return it
            return $result;
        
        $this->setLastError($stmt, $query); //if we're here it's cause something bad happened
        return false;
    }
    
    /*! \fn executeCachedQuery ($query, $vars)
     *  \brief Checks cache first for the query and then will execute a read slave if missing
    */
    protected function executeCachedQuery ($query, $vars = null) {
        $key = $query;
        if (is_array($vars)){
            foreach($vars as $v)
                $key .= $v. ',';
        }
            
        $cache = $this->alz->getCache($key);
        if ($cache === false) {
            $result = $this->executeReadSlaveQuery($query, $vars);
            $this->alz->setCache($key, $result);    //cache this for next time
            return $result;
        }
        else
            return $cache;  //we had a hit
    }
    
    /*! \fn executeReadSlaveQuery ($query, $vars)
     *  \brief Executes the selected query against the slave or read database
    */
    protected function executeReadSlaveQuery ($query, $vars = null) {
        
        switch ($this->dbType) {
            case NEDB::DB_TYPE_MYSQL:
            default:
                $stmt = $this->dbRead->prepare($query);     //prepare the query
                $result = ($this->fetchReadQuery($stmt, $vars, $query));
                break;
            
            case NEDB::DB_TYPE_ORACLE:
                $stmt = oci_parse($this->dbRead, $query);
                $result = $this->fetchOracleQuery ($stmt, $vars);
                break;
        }
        
        return $result;
    }
    
    /*! \fn executeReadMasterQuery ($query, $vars)
     *  \brief Executes the selected query against the master database
    */
    protected function executeReadMasterQuery ($query, $vars = null) {
        switch ($this->dbType) {
            case NEDB::DB_TYPE_MYSQL:
            default:
                $stmt = $this->dbMaster->prepare($query);     //prepare the query
                return ($this->fetchReadQuery($stmt, $vars, $query));
                break;
            
            case NEDB::DB_TYPE_ORACLE:
                $stmt = oci_parse($this->dbRead, $query);
                return ($this->fetchOracleQuery ($stmt, $vars));
                break;
        }
    }

}
?>