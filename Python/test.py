"""@package test.py

@Created: 2014-11-04
@Author: Nathan Thomas

written for python 3.X
This takes 2 command line arguements, $python test.py <input file> <output dir>
It will sort the input file and print the contents into an output file named result.txt
"""

# Imports
import sys, os, re

""" Used to do some initial checks.
First is for the python version.  We need 3.x in order to use the isnumeric function
Second check is for the command line arguments, we're looking for 2 in this case, an input file, and an output directory
"""
def checkCommandLine():
    if sys.version_info[0] < 3:
        print ("Script requires python 3.X  I wanted to use the isnumeric function")
        quit()
    
    if len(sys.argv) != 3:
        print ("Script requires 2 arguments.  First is the input file, the second is the output directory")
        quit()
    

""" Main class.  This handles the logic for reading the file, sorting, and writing """
class SortFile:
    def __init__(self, target='result.txt'):
        self.targetOutput = target
    
    """ Used to verify the existance of the input file we're going to read from """
    def _verifyInputFile(self):
        if not os.path.exists(self.inFile):
            print ("Input file does not exist: %s" % self.inFile)
            return False
        return True
    
    """ Used to verify that we have write permission to the output directory where we're going to put our result file """
    def _verifyOutFile(self):
        if not os.access(os.path.dirname(self.outFile), os.W_OK):
            print ("Output file location is not valid.  Please check write permissions: %s" % self.outFile)
            return False
        return True
    
    """ Meat and potatoes, this will read from the input, sort, and write to the output """
    def _sortIt(self):
        try:
            with open(self.inFile, 'r') as readFile, open(os.path.join(self.outFile, self.targetOutput), 'w') as writeFile:
                for line in readFile:
                    line = re.sub(' +', ' ', line.strip())  #remove extra spaces
                    nothingSpecial = ''.join(a for a in line.strip('\n') if a.isalnum() or a.isspace()) #remove special characters
                    
                    if len(nothingSpecial) > 0:
                        inArray = nothingSpecial.split(' ') #break our string into an array of objects
                        
                        #reset our arrays
                        numList = []    #this holds the numbers from the read file line
                        charList = []   #this holds just the strings from our file line
                        numFlag = []    #this keeps track of the order of our elements and whether or not it was a number or a string.  We do this so we can put it back together later
                        
                        for val in inArray: # loop through our array and separate the numbers from the strings
                            if val.isnumeric():
                                numList.append(val)
                                numFlag.append(True)
                            else:                       #this is a string
                                charList.append(val)
                                numFlag.append(False)
                        
                        numList = list(map(int, numList))   #when you append the int, it converts it into a string, instead of a number, if i was better at python I may know a better way to do this
                        charList = sorted(charList, key=lambda a: a.lower())    #do it this way so we sort case-insensitive but keep track of the capitals
                        numList.sort()  #simple number sort
                        
                        outString = []  #init the output string that we're going to create by recombining the array of sorted numbers and strings
                        charIdx = 0     #use these indexes to keep track of where we are in each array
                        numIdx = 0
                        
                        """ We now go back through our array of flags to indicate if the element was a number or a character.
                            This allows us to make sure that we keep the order of characters and numbers now that we've sorted them """
                        for val in numFlag:
                            if val: #this is a number
                                outString.append(str(numList[numIdx]))
                                numIdx += 1
                            else:
                                outString.append(charList[charIdx])
                                charIdx += 1
                        
                        writeFile.write(' '.join(outString))
                    writeFile.write('\n')   #add a return line
            
            return True
        except:
            print ("We had an exception reading or writing to a file.  Please check your file permissions and try again")
            return False
    
    
    """ Main entry point to the class, pass in the input file and output file, this will handle the rest """
    def sortFile(self, inFile, outFile):
        self.inFile = inFile
        self.outFile = outFile
        
        result = self._verifyInputFile()    # verify the input file exists
        if result:
            result = self._verifyOutFile()  # verify the output file can be created
            if result:
                result = self._sortIt()  #do the file
                if result:  #we sorted the file
                    return os.path.join(self.outFile, self.targetOutput)
                
        return False
    

# Check the command line arguments
checkCommandLine()

sf = SortFile() #create an instance of our class
result = sf.sortFile(sys.argv[1], sys.argv[2])  #sort our command line arguments

if result:  #if things worked, let the user know
    print ("Sorted to: %s" % result)

