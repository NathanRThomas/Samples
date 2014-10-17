<?php
/*! \file LoanShark.php
 *  \brief Handles payment processing
 *  \author Nathan
 *  
 *
Modifications:
2013-08-17 NT   Created

-----------------------------------------------------------------------------------------------------*/

namespace LoanShark;

  //-----------------------------------------------------------------------------------------------------------//
 //----- REQUIRED LIBRARIES ----------------------------------------------------------------------------------//
//-----------------------------------------------------------------------------------------------------------//
require_once ('vendor/stripe/stripe-php/lib/Stripe.php');


class PaymentServiceEnum {
    const STRIPE        = 1;
}

class ErrorStruct {
    const ERR_FIND_CHARGE           = -24000;
    const ERR_REFUND_CHARGE         = -24001;
    const ERR_NEW_CHARGE            = -24002;
    
    protected $code                 = 0;
    protected $msg                  = '';
    protected $nativeCode           = 0;
    protected $nativeMsg            = '';
    protected $lineNumber           = 0;
    protected $misc                 = '';
}

class LoanShark {

  //-----------------------------------------------------------------------------------------------------------//
 //----- CONSTANTS -------------------------------------------------------------------------------------------//
//-----------------------------------------------------------------------------------------------------------//
    const EXCP_INVALID_PAYMENT_TYPE         = 1;
    
  //-----------------------------------------------------------------------------------------------------------//
 //----- PRIVATE VARIABLES -----------------------------------------------------------------------------------//
//-----------------------------------------------------------------------------------------------------------//

    private $payment_type               = 0;        ///< The payment processesor we're going to use for this instance
    private $debug_flag                 = true;     ///< If we're in debug mode
    private $error;                                 ///< Keeps track of any errors we've had
    
    private $stripe_test_secret_key     = 'sk_test_';
    private $stripe_test_publish_key    = 'pk_test_';
    
    private $stripe_live_secret_key     = 'sk_live_';
    private $stripe_live_publish_key    = 'pk_live_';
    
  //-----------------------------------------------------------------------------------------------------------//
 //----- PUBLIC FUNCTIONS -----------------------------------------------------------------------------------//
//-----------------------------------------------------------------------------------------------------------//

    /*! \fn getLastError ()
     *  \brief Returns the last recorded error in our class
    */
    function getLastError () {
        return $this->error;
    }
    
    /*! \fn issueRefund ($paymentToken, $amount)
     *  \brief Used to issue a refund to a previous purchase
    */
    function issueRefund ($paymentToken, $amount = 0) {
        
        //figure out which payment we're using
        switch ($this->payment_type) {
            case PaymentServiceEnum::STRIPE:
                
                try {   //get the charge
                    $ch = \Stripe_Charge::retrieve($paymentToken);
                }
                catch (\Stripe_InvalidRequestError $e) {
                    if ($this->debug_flag)
                        return 'dev test';
                    
                    $this->_setError(__line__, ErrorStruct::ERR_FIND_CHARGE, $e->getMessate());
                    return false;
                }
                catch (Exception $e) {
                    $this->_setError(__line__, ErrorStruct::ERR_FIND_CHARGE, $e->getMessate());
                    return false;
                }
                
                try {   //refund the charge
                    if ($amount > 0)
                        $re = $ch->refund(array('amount'=>$amount));
                    else
                        $re = $ch->refund();    //just refund the whole thing
                        
                    //var_dump($re['refunds'][count($re['refunds']) -1]['id']);
                    
                    return $re['refunds'][count($re['refunds']) -1]['id'];
                }
                catch (Exception $e) {
                    $this->_setError(__line__, ErrorStruct::ERR_REFUND_CHARGE, $e->getMessate());
                    return false;
                }
                
                break;
            
            default:
                throw new Exception('Invalid Payment Type', this::EXCP_INVALID_PAYMENT_TYPE);
                return false;
                break;
        }
    }
    
    function newCharge ($paymentToken, $amount, $description) {
        
        //figure out which payment we're using
        switch ($this->payment_type) {
            case PaymentServiceEnum::STRIPE:
                
                try {   //get the charge
                    $re = \Stripe_Charge::create(array('amount'=>$amount, 'currency'=>'usd', 'card'=>$paymentToken, 'description'=>$description));
                    
                    if (isset($re['id'])) {
                        return $re['id'];
                    }
                    else {
                        $this->_setError(__line__, ErrorStruct::ERR_NEW_CHARGE, 'Non fatal error');
                        return false;
                    }
                }
                catch (Exception $e) {
                    $this->_setError(__line__, ErrorStruct::ERR_NEW_CHARGE, $e->getMessate());
                    return false;
                }
                
                break;
            
            default:
                throw new Exception('Invalid Payment Type', this::EXCP_INVALID_PAYMENT_TYPE);
                return false;
                break;
        }
    }

  //-----------------------------------------------------------------------------------------------------------//
 //----- PRIVATE FUNCTIONS -----------------------------------------------------------------------------------//
//-----------------------------------------------------------------------------------------------------------//

    /*! \fn __construct (MailServiceEnum $mailer_type, $smtp_username = false, $smtp_password = false)
     *  \brief Constructor for the class.  Looks for specific info upon startup and validates it
     *  \param $mail_type - Based on the MailServiceEnum, this is the actual mailer we want to use
     *  \param $smtp_username - Username for the mailer service
     *  \param $smtp_password - Password for associated username for the service
    */
    function __construct ($payment_type, $debugFlag = true) {
        $this->error = new ErrorStruct();
        
        //verify the payment type choosen
        switch ($payment_type) {
            case PaymentServiceEnum::STRIPE:   //it exists
            default:
                $this->payment_type = $payment_type;  //set the local type
                $this->debug_flag = $debugFlag;
                if ($debugFlag)
                    \Stripe::setApiKey($this->stripe_test_secret_key);
                else
                    \Stripe::setApiKey($this->stripe_live_secret_key);
                
                break;
        }
        
    }
    
    /*! \fn _setError ($line, $code = 0, $nativeMsg = '', $nativeCode = 0, $misc = '')
     *  \brief Internal error handler
    */
    function _setError ($line, $code = 0, $nativeMsg = '', $nativeCode = 0, $misc = '') {
        
        $this->error->code = $code;
        $this->error->lineNumber = $line;
        $this->error->nativeMsg = $nativeMsg;
        $this->error->nativeCode = $nativeCode;
        $this->error->misc = $misc;
        
        switch ($code) {
            case ErrorStruct::ERR_FIND_CHARGE:
                $this->error->msg = 'Charge not found';
                break;
            
            case ErrorStruct::ERR_REFUND_CHARGE:
                $this->error->msg = 'Error issuing refund';
                break;
            
            case ErrorStruct::ERR_NEW_CHARGE:
                $this->error->msg = 'Error charging user';
                break;
            
            default:
                $this->error->msg = '';
                break;
        }
    }
    

}