-- MySQL dump 10.13  Distrib 5.7.12, for Win64 (x86_64)
--
-- Host: 72.61.126.206    Database: pos-react
-- ------------------------------------------------------
-- Server version	5.5.5-10.6.24-MariaDB-ubu2204

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `tblcategory`
--

DROP TABLE IF EXISTS `tblcategory`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tblcategory` (
  `AID` int(11) NOT NULL AUTO_INCREMENT,
  `Category` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`AID`)
) ENGINE=InnoDB AUTO_INCREMENT=54 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tblcategory`
--

LOCK TABLES `tblcategory` WRITE;
/*!40000 ALTER TABLE `tblcategory` DISABLE KEYS */;
INSERT INTO `tblcategory` VALUES (32,'အိတ်'),(33,'ဖိနပ်'),(34,'ခါးပတ်'),(35,'ကုတ်'),(36,'အထည်စ'),(39,'နှုတ်ခမ်းနီ'),(40,'cosmetic'),(41,'ပုဝါ'),(42,'ထီး'),(43,'အခင်းစ'),(44,'သွားတိုက်ဆေး'),(45,'အီလက်ထရောနစ်'),(46,'အခြား'),(47,'ရေမွှေး'),(48,'အင်္ကျီ(ကျား)'),(49,'အင်္ကျီ(မ)'),(50,'နာရီ'),(51,'test'),(53,'testing');
/*!40000 ALTER TABLE `tblcategory` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tblcreditdetail`
--

DROP TABLE IF EXISTS `tblcreditdetail`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tblcreditdetail` (
  `AID` int(11) NOT NULL AUTO_INCREMENT,
  `VNO` varchar(45) DEFAULT NULL,
  `CustomerID` int(11) DEFAULT NULL,
  `Amt` double DEFAULT 0,
  `PaymentMethod` varchar(50) DEFAULT 'Cash',
  `Date` date DEFAULT NULL,
  `UserID` int(11) DEFAULT NULL,
  PRIMARY KEY (`AID`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tblcreditdetail`
--

LOCK TABLES `tblcreditdetail` WRITE;
/*!40000 ALTER TABLE `tblcreditdetail` DISABLE KEYS */;
INSERT INTO `tblcreditdetail` VALUES (3,'VN202512080381',9,2000,'Cash','2025-12-30',1),(4,'VN202512080381',9,200000,'Cash','2025-12-30',1),(6,'VN202601060026',84,1205000,'Cash','2026-01-06',1),(7,'VN202601060007',9,30000,'KPay','2026-01-06',1),(8,'VN202601060007',9,300000,'KPay','2026-01-06',1),(9,'VN202601110009',95,2000,'Cash','2026-01-11',1),(10,'VN202601110009',95,2000,'Cash','2026-01-11',1);
/*!40000 ALTER TABLE `tblcreditdetail` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tblcreditpay`
--

DROP TABLE IF EXISTS `tblcreditpay`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tblcreditpay` (
  `AID` int(11) NOT NULL AUTO_INCREMENT,
  `CustomerID` int(11) DEFAULT NULL,
  `Amt` double DEFAULT 0,
  `Date` date DEFAULT NULL,
  `UserID` int(11) DEFAULT NULL,
  `Rmk` varchar(100) DEFAULT NULL,
  `VNO` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`AID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tblcreditpay`
--

LOCK TABLES `tblcreditpay` WRITE;
/*!40000 ALTER TABLE `tblcreditpay` DISABLE KEYS */;
/*!40000 ALTER TABLE `tblcreditpay` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tblcustomer`
--

DROP TABLE IF EXISTS `tblcustomer`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tblcustomer` (
  `AID` int(11) NOT NULL AUTO_INCREMENT,
  `Name` varchar(100) DEFAULT NULL,
  `Gender` varchar(45) DEFAULT NULL,
  `DOB` date DEFAULT NULL,
  `Age` int(11) DEFAULT NULL,
  `Email` varchar(100) DEFAULT NULL,
  `PhoneNo` varchar(100) DEFAULT NULL,
  `Address` varchar(200) DEFAULT NULL,
  `Img` varchar(50) DEFAULT NULL,
  `MemberDate` date DEFAULT NULL,
  `UserName` varchar(100) DEFAULT NULL,
  `Password` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`AID`)
) ENGINE=InnoDB AUTO_INCREMENT=96 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tblcustomer`
--

LOCK TABLES `tblcustomer` WRITE;
/*!40000 ALTER TABLE `tblcustomer` DISABLE KEYS */;
INSERT INTO `tblcustomer` VALUES (1,'Myat Myo',NULL,NULL,NULL,'1','1','1',NULL,NULL,NULL,NULL),(2,'Wai Htay',NULL,NULL,NULL,'1','1','1',NULL,NULL,NULL,NULL),(3,'မမိုး',NULL,NULL,NULL,'1','1','1',NULL,NULL,NULL,NULL),(4,'မမာလာ',NULL,NULL,NULL,'1','1','1',NULL,NULL,NULL,NULL),(5,'မစုလှိုင်ထွန်း',NULL,NULL,NULL,'1','1','1',NULL,NULL,NULL,NULL),(6,'ဒေါ်စန်းစန်းထွေး',NULL,NULL,NULL,'1','1','1',NULL,NULL,NULL,NULL),(7,'မယွန်းလဲ့',NULL,NULL,NULL,'1','1','1',NULL,NULL,NULL,NULL),(8,'မဆွေဆွေ',NULL,NULL,NULL,'1','1','1',NULL,NULL,NULL,NULL),(9,'Aye Zarchi Oo',NULL,NULL,NULL,'1','1','1',NULL,NULL,NULL,NULL),(10,'မဇာ',NULL,NULL,NULL,'1','1','1',NULL,NULL,NULL,NULL),(11,'မငြိမ်းငြိမ်းစံ',NULL,NULL,NULL,'1','1','1',NULL,NULL,NULL,NULL),(12,'Ma Nandar',NULL,NULL,NULL,'1','1','1',NULL,NULL,NULL,NULL),(13,'Ma PaPa',NULL,NULL,NULL,'1','1','1',NULL,NULL,NULL,NULL),(14,'မတင်နီလာလင်း',NULL,NULL,NULL,'1','1','1',NULL,NULL,NULL,NULL),(15,'မိုးမိုးအောင်',NULL,NULL,NULL,'1','1','1',NULL,NULL,NULL,NULL),(16,'မမြတ်',NULL,NULL,NULL,'1','1','1',NULL,NULL,NULL,NULL),(17,'မသီတာ',NULL,NULL,NULL,'1','1','1',NULL,NULL,NULL,NULL),(18,'မဆုကဗျာ',NULL,NULL,NULL,'1','1','1',NULL,NULL,NULL,NULL),(19,'မနီနီ',NULL,NULL,NULL,'1','1','1',NULL,NULL,NULL,NULL),(20,'မဖြိုး',NULL,NULL,NULL,'1','1','1',NULL,NULL,NULL,NULL),(21,'မသက်',NULL,NULL,NULL,'1','1','1',NULL,NULL,NULL,NULL),(22,'ဒေါ်ကြွယ်ကြွယ်သိန်း',NULL,NULL,NULL,'1','1','1',NULL,NULL,NULL,NULL),(23,'မမေသူ',NULL,NULL,NULL,'1','1','1',NULL,NULL,NULL,NULL),(24,'Cherry Pink',NULL,NULL,NULL,'1','1','1',NULL,NULL,NULL,NULL),(25,'မသိမ့်',NULL,NULL,NULL,'1','1','1',NULL,NULL,NULL,NULL),(26,'မကြည်',NULL,NULL,NULL,'1','1','1',NULL,NULL,NULL,NULL),(27,'မနု',NULL,NULL,NULL,'1','1','1',NULL,NULL,NULL,NULL),(28,'Ma Wai',NULL,NULL,NULL,'1','1','1',NULL,NULL,NULL,NULL),(29,'O Mar Tin',NULL,NULL,NULL,'1','1','1',NULL,NULL,NULL,NULL),(30,'Ma Yupar',NULL,NULL,NULL,'1','1','1',NULL,NULL,NULL,NULL),(31,'Ma Theingi',NULL,NULL,NULL,'1','1','1',NULL,NULL,NULL,NULL),(32,'ဒေါ်မိုးမိုး(ကျိုင်းတုံ)',NULL,NULL,NULL,'1','1','1',NULL,NULL,NULL,NULL),(33,'မစုစုခိုင်',NULL,NULL,NULL,'1','1','1',NULL,NULL,NULL,NULL),(34,'Kyi Cin Su Wai',NULL,NULL,NULL,'1','1','1',NULL,NULL,NULL,NULL),(35,'Yu Shwe Sin Win',NULL,NULL,NULL,'1','1','1',NULL,NULL,NULL,NULL),(36,'မငြိမ်း',NULL,NULL,NULL,'1','1','1',NULL,NULL,NULL,NULL),(37,'ခင်ခင်ကြီး',NULL,NULL,NULL,'1','1','1',NULL,NULL,NULL,NULL),(38,'မသန္တာ (တတက ၆)',NULL,NULL,NULL,'1','1','1',NULL,NULL,NULL,NULL),(39,'မလွင်မာ',NULL,NULL,NULL,'1','1','1',NULL,NULL,NULL,NULL),(40,'မဖြူ',NULL,NULL,NULL,'1','1','1',NULL,NULL,NULL,NULL),(41,'May Sabal Phyo',NULL,NULL,NULL,'1','1','1',NULL,NULL,NULL,NULL),(42,'မသန္တာ (၄၄)',NULL,NULL,NULL,'1','1','1',NULL,NULL,NULL,NULL),(43,'မဝေဝေ',NULL,NULL,NULL,'1','1','1',NULL,NULL,NULL,NULL),(44,'မဝါဝါ',NULL,NULL,NULL,'1','1','1',NULL,NULL,NULL,NULL),(45,'မလှလှခက်',NULL,NULL,NULL,'1','1','1',NULL,NULL,NULL,NULL),(46,'မစုပြည့်',NULL,NULL,NULL,'1','1','1',NULL,NULL,NULL,NULL),(47,'မချောချော',NULL,NULL,NULL,'1','1','1',NULL,NULL,NULL,NULL),(48,'ရွှေစင်စိုးလွင်',NULL,NULL,NULL,'1','1','1',NULL,NULL,NULL,NULL),(49,'မပန်ပန်',NULL,NULL,NULL,'1','1','1',NULL,NULL,NULL,NULL),(50,'Zar Phyu Pwint',NULL,NULL,NULL,'1','1','1',NULL,NULL,NULL,NULL),(51,'Khin Zar Chi Mg',NULL,NULL,NULL,'1','1','1',NULL,NULL,NULL,NULL),(52,'မသူဇာမောင်လေး',NULL,NULL,NULL,'1','1','1',NULL,NULL,NULL,NULL),(53,'Tulip Lay',NULL,NULL,NULL,'1','1','1',NULL,NULL,NULL,NULL),(54,'Ma Thiri Nandar',NULL,NULL,NULL,'1','1','1',NULL,NULL,NULL,NULL),(55,'Xlaing Xlaing',NULL,NULL,NULL,'1','1','1',NULL,NULL,NULL,NULL),(56,'မယု',NULL,NULL,NULL,'1','1','1',NULL,NULL,NULL,NULL),(57,'မငယ်',NULL,NULL,NULL,'1','1','1',NULL,NULL,NULL,NULL),(58,'Ma Htike Htike',NULL,NULL,NULL,'1','1','1',NULL,NULL,NULL,NULL),(59,'Ma Thiri ဝက ကတော်',NULL,NULL,NULL,'1','1','1',NULL,NULL,NULL,NULL),(60,'စုစု',NULL,NULL,NULL,'1','1','1',NULL,NULL,NULL,NULL),(61,'နီလာ နီလာ',NULL,NULL,NULL,'1','1','1',NULL,NULL,NULL,NULL),(62,'Htet Htet',NULL,NULL,NULL,'1','1','1',NULL,NULL,NULL,NULL),(63,'မချယ်ရီ',NULL,NULL,NULL,'1','1','1',NULL,NULL,NULL,NULL),(64,'မခိုင်ဇာ',NULL,NULL,NULL,'1','1','1',NULL,NULL,NULL,NULL),(65,'Daw KKT',NULL,NULL,NULL,'1','1','1',NULL,NULL,NULL,NULL),(66,'Ma Shwe Sin ဥစတ',NULL,NULL,NULL,'1','1','1',NULL,NULL,NULL,NULL),(67,'မသူဇာ (ရဲ)',NULL,NULL,NULL,'1','1','1',NULL,NULL,NULL,NULL),(68,'Ei Phyu Nyein',NULL,NULL,NULL,'1','1','1',NULL,NULL,NULL,NULL),(69,'၈၈ တမမ ဇနီး',NULL,NULL,NULL,'1','1','1',NULL,NULL,NULL,NULL),(70,'Ma Myint Zu',NULL,NULL,NULL,'1','1','1',NULL,NULL,NULL,NULL),(71,'Thin Wut Hmon',NULL,NULL,NULL,'1','1','1',NULL,NULL,NULL,NULL),(72,'Unty Phyo (NDC)',NULL,NULL,NULL,'1','1','1',NULL,NULL,NULL,NULL),(73,'P & K',NULL,NULL,NULL,'1','1','1',NULL,NULL,NULL,NULL),(74,'Moe Thet San',NULL,NULL,NULL,'1','1','1',NULL,NULL,NULL,NULL),(75,'အန်တီနု(အန်တီစံပယ်)',NULL,NULL,NULL,'1','1','1',NULL,NULL,NULL,NULL),(76,'Su',NULL,NULL,NULL,'1','1','1',NULL,NULL,NULL,NULL),(77,'Nyein Nyein San',NULL,NULL,NULL,'1','1','1',NULL,NULL,NULL,NULL),(78,'Shwe Sin Soe Lwin',NULL,NULL,NULL,'1','1','1',NULL,NULL,NULL,NULL),(79,'မထွေးထွေး',NULL,NULL,NULL,'1','1','1',NULL,NULL,NULL,NULL),(80,'မနှင်းနှင်းကို',NULL,NULL,NULL,'1','1','1',NULL,NULL,NULL,NULL),(81,'မစုနန္ဒာ',NULL,NULL,NULL,'1','1','1',NULL,NULL,NULL,NULL),(82,'New Customer',NULL,NULL,NULL,'1','1','1',NULL,NULL,NULL,NULL),(83,'ဖြိုးဖြိုး ivy',NULL,NULL,NULL,'1','1','1',NULL,NULL,NULL,NULL),(84,'Cherry San',NULL,NULL,NULL,'1','1','1',NULL,NULL,NULL,NULL),(85,'မစု',NULL,NULL,NULL,'1','1','1',NULL,NULL,NULL,NULL),(87,'New Customer',NULL,NULL,NULL,'1','1','1',NULL,NULL,NULL,NULL),(88,'New',NULL,NULL,NULL,'1','1','1',NULL,NULL,NULL,NULL),(89,'အန်တီစုလေး',NULL,NULL,NULL,'1','1','1',NULL,NULL,NULL,NULL),(90,'အန်တီသီင်္ဂီ',NULL,NULL,NULL,'n@gmail.com','1','ပဲခူး',NULL,NULL,NULL,NULL),(91,'အန်တီ သီင်္ဂီ',NULL,NULL,NULL,'1','1','1',NULL,NULL,NULL,NULL),(92,'အန်တီမေသူ fri',NULL,NULL,NULL,'1','1','1',NULL,NULL,NULL,NULL),(93,'မဖွေးဖွေး',NULL,NULL,NULL,'1','1','1',NULL,NULL,NULL,NULL),(94,'customer one',NULL,NULL,NULL,'','09878998','yangon',NULL,NULL,NULL,NULL),(95,'Aye Aye',NULL,NULL,NULL,'','09799200303','သာယာကုန်း',NULL,NULL,NULL,NULL);
/*!40000 ALTER TABLE `tblcustomer` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tblexpense`
--

DROP TABLE IF EXISTS `tblexpense`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tblexpense` (
  `AID` int(11) NOT NULL AUTO_INCREMENT,
  `UserID` int(11) DEFAULT NULL,
  `Reason` varchar(100) DEFAULT NULL,
  `Amount` float DEFAULT 0,
  `Date` date DEFAULT NULL,
  `File` varchar(100) DEFAULT NULL,
  `ViewFile` varchar(100) DEFAULT NULL,
  `ExpenseCategoryID` int(11) NOT NULL DEFAULT 1,
  PRIMARY KEY (`AID`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tblexpense`
--

LOCK TABLES `tblexpense` WRITE;
/*!40000 ALTER TABLE `tblexpense` DISABLE KEYS */;
INSERT INTO `tblexpense` VALUES (1,NULL,'test',20000,'2025-12-04',NULL,NULL,1),(2,NULL,'နနတ',6000,'2025-12-03',NULL,NULL,2),(3,NULL,'asdfasdf',10000,'2026-01-06',NULL,NULL,5),(4,NULL,'မီတာဘေ ဆောင်လိုက်တယ်',50000,'2026-01-06',NULL,NULL,6),(5,NULL,'၁၂',1,'2026-01-09',NULL,NULL,6);
/*!40000 ALTER TABLE `tblexpense` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tblexpense_category`
--

DROP TABLE IF EXISTS `tblexpense_category`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tblexpense_category` (
  `AID` int(11) NOT NULL AUTO_INCREMENT,
  `Name` varchar(200) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL,
  PRIMARY KEY (`AID`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tblexpense_category`
--

LOCK TABLES `tblexpense_category` WRITE;
/*!40000 ALTER TABLE `tblexpense_category` DISABLE KEYS */;
INSERT INTO `tblexpense_category` VALUES (1,'expense 1'),(2,'expense 2'),(3,'expense 3'),(4,'eeနန'),(5,'category one'),(6,'မီတာဘေ');
/*!40000 ALTER TABLE `tblexpense_category` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tbllog`
--

DROP TABLE IF EXISTS `tbllog`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tbllog` (
  `AID` int(11) NOT NULL AUTO_INCREMENT,
  `Description` varchar(100) DEFAULT NULL,
  `UserID` int(11) DEFAULT NULL,
  `Date` datetime DEFAULT NULL,
  `IPAddress` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`AID`)
) ENGINE=InnoDB AUTO_INCREMENT=675 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tbllog`
--

LOCK TABLES `tbllog` WRITE;
/*!40000 ALTER TABLE `tbllog` DISABLE KEYS */;
INSERT INTO `tbllog` VALUES (1,'admin သည် vno: 20250830-132031 ဖြင့် cash အရောင်းသွင်းသွားသည်။',1,'2025-08-30 13:20:31',NULL),(2,'admin သည် vno: 20250830-132052 ဖြင့် credit အရောင်းသွင်းသွားသည်။',1,'2025-08-30 13:20:52',NULL),(3,'admin သည် vno: 20250830-132031 ၏ cash အရောင်းစာရင်းအားဖျက်သွားသည်။',1,'2025-08-30 13:21:24',NULL),(4,'admin သည် vno: 20250830-132052 ၏ credit အရောင်းစာရင်းအားဖျက်သွားသည်။',1,'2025-08-30 13:21:33',NULL),(5,'adminLogout လုပ်သွားသည်',1,'2025-08-30 13:21:46',NULL),(6,'admin Login ဝင်သွားသည်',1,'2025-08-30 13:25:13',NULL),(7,'adminLogout လုပ်သွားသည်',1,'2025-08-30 13:28:16',NULL),(8,'admin Login ဝင်သွားသည်',1,'2025-08-30 13:28:44',NULL),(9,'adminLogout လုပ်သွားသည်',1,'2025-08-30 13:28:57',NULL),(10,'admin Login ဝင်သွားသည်',1,'2025-08-30 13:29:13',NULL),(11,'adminLogout လုပ်သွားသည်',1,'2025-08-30 13:32:19',NULL),(12,'admin Login ဝင်သွားသည်',1,'2025-08-30 13:33:36',NULL),(13,'admin သည် vno: 20250830-135144 ဖြင့် cash အရောင်းသွင်းသွားသည်။',1,'2025-08-30 13:51:44',NULL),(14,'admin သည် vno: 20250830-135144 ၏ cash အရောင်းစာရင်းအားဖျက်သွားသည်။',1,'2025-08-30 13:52:43',NULL),(15,'adminLogout လုပ်သွားသည်',1,'2025-08-30 13:53:22',NULL),(16,'admin Login ဝင်သွားသည်',1,'2025-08-30 13:53:28',NULL),(17,'adminLogout လုပ်သွားသည်',1,'2025-08-30 13:55:05',NULL),(18,'admin Login ဝင်သွားသည်',1,'2025-08-30 13:55:13',NULL),(19,'adminLogout လုပ်သွားသည်',1,'2025-08-30 13:56:38',NULL),(20,'admin Login ဝင်သွားသည်',1,'2025-08-30 14:00:48',NULL),(21,'adminသည် customer အား update လုပ်သွားသည်။',1,'2025-08-30 14:01:56',NULL),(22,'adminသည် customer အား update လုပ်သွားသည်။',1,'2025-08-30 14:02:18',NULL),(23,'adminသည် customer အား update လုပ်သွားသည်။',1,'2025-08-30 14:02:26',NULL),(24,'admin Login ဝင်သွားသည်',1,'2025-08-30 14:04:48',NULL),(25,'adminLogout လုပ်သွားသည်',1,'2025-08-30 14:15:19',NULL),(26,'admin Login ဝင်သွားသည်',1,'2025-08-30 14:15:22',NULL),(27,'adminLogout လုပ်သွားသည်',1,'2025-08-30 14:16:55',NULL),(28,'admin Login ဝင်သွားသည်',1,'2025-08-30 14:16:59',NULL),(29,'adminLogout လုပ်သွားသည်',1,'2025-08-30 14:17:35',NULL),(30,'admin Login ဝင်သွားသည်',1,'2025-08-30 14:17:41',NULL),(31,'adminLogout လုပ်သွားသည်',1,'2025-08-30 14:19:43',NULL),(32,'admin Login ဝင်သွားသည်',1,'2025-08-30 14:19:45',NULL),(33,'adminLogout လုပ်သွားသည်',1,'2025-08-30 14:21:13',NULL),(34,'admin Login ဝင်သွားသည်',1,'2025-08-30 14:21:16',NULL),(35,'adminLogout လုပ်သွားသည်',1,'2025-08-30 14:21:59',NULL),(36,'admin Login ဝင်သွားသည်',1,'2025-08-30 14:22:02',NULL),(37,'admin သည် user အားအသစ်သွင်းသွားသည်။',1,'2025-08-30 14:44:12',NULL),(38,'admin သည် vno: 20250830-144441 ဖြင့် cash အရောင်းသွင်းသွားသည်။',1,'2025-08-30 14:44:41',NULL),(39,'adminLogout လုပ်သွားသည်',1,'2025-08-30 15:49:08',NULL),(40,'admin Login ဝင်သွားသည်',1,'2025-08-30 15:49:11',NULL),(41,'adminLogout လုပ်သွားသည်',1,'2025-08-30 18:51:55',NULL),(42,'admin Login ဝင်သွားသည်',1,'2025-08-30 18:52:00',NULL),(43,'admin သည် purchase အားအသစ်သွင်းသွားသည်။',1,'2025-08-30 21:32:20',NULL),(44,'admin သည် purchase အားအသစ်သွင်းသွားသည်။',1,'2025-08-30 21:33:48',NULL),(45,'adminသည် purchase အား update လုပ်သွားသည်။',1,'2025-08-30 21:34:07',NULL),(46,'admin သည် purchase အားအသစ်သွင်းသွားသည်။',1,'2025-08-30 21:38:19',NULL),(47,'admin သည် purchase အားအသစ်သွင်းသွားသည်။',1,'2025-08-30 21:39:17',NULL),(48,'admin သည် purchase အားအသစ်သွင်းသွားသည်။',1,'2025-08-30 21:41:16',NULL),(49,'admin သည် purchase အားအသစ်သွင်းသွားသည်။',1,'2025-08-30 21:42:22',NULL),(50,'admin သည် purchase အားအသစ်သွင်းသွားသည်။',1,'2025-08-30 21:44:33',NULL),(51,'admin သည် purchase အားအသစ်သွင်းသွားသည်။',1,'2025-08-30 21:46:01',NULL),(52,'adminသည် purchase အား update လုပ်သွားသည်။',1,'2025-08-30 21:47:05',NULL),(53,'admin သည် purchase အားအသစ်သွင်းသွားသည်။',1,'2025-08-30 21:47:22',NULL),(54,'admin သည် purchase အားဖျက်သွားသည်။',1,'2025-08-30 21:48:44',NULL),(55,'admin သည် purchase အားအသစ်သွင်းသွားသည်။',1,'2025-08-30 21:50:15',NULL),(56,'admin သည် purchase အားအသစ်သွင်းသွားသည်။',1,'2025-08-30 21:52:41',NULL),(57,'admin သည် purchase အားအသစ်သွင်းသွားသည်။',1,'2025-08-30 22:27:37',NULL),(58,'adminသည် purchase အား update လုပ်သွားသည်။',1,'2025-08-30 22:48:24',NULL),(59,'adminသည် purchase photo အား update လုပ်သွားသည်။',1,'2025-08-30 22:48:39',NULL),(60,'admin သည် purchase အားအသစ်သွင်းသွားသည်။',1,'2025-08-30 23:48:01',NULL),(61,'admin သည် purchase အားအသစ်သွင်းသွားသည်။',1,'2025-08-30 23:49:46',NULL),(62,'admin သည် purchase အားအသစ်သွင်းသွားသည်။',1,'2025-08-30 23:52:42',NULL),(63,'admin သည် user အားအသစ်သွင်းသွားသည်။',1,'2025-08-31 00:00:42',NULL),(64,'admin သည် vno: 20250831-000524 ဖြင့် cash အရောင်းသွင်းသွားသည်။',1,'2025-08-31 00:05:24',NULL),(65,'admin သည် vno: 20250831-000524 ၏ cash အရောင်းစာရင်းအားဖျက်သွားသည်။',1,'2025-08-31 00:15:52',NULL),(66,'admin သည် vno: 20250831-001635 ဖြင့် cash အရောင်းသွင်းသွားသည်။',1,'2025-08-31 00:16:35',NULL),(67,'admin သည် vno: 20250831-001635 ၏ cash အရောင်းစာရင်းအားဖျက်သွားသည်။',1,'2025-08-31 00:21:03',NULL),(68,'admin သည် vno: 20250831-002126 ဖြင့် cash အရောင်းသွင်းသွားသည်။',1,'2025-08-31 00:21:26',NULL),(69,'admin သည် purchase အားအသစ်သွင်းသွားသည်။',1,'2025-08-31 00:27:55',NULL),(70,'admin သည် purchase အားအသစ်သွင်းသွားသည်။',1,'2025-08-31 00:30:23',NULL),(71,'adminသည် purchase အား update လုပ်သွားသည်။',1,'2025-08-31 00:31:28',NULL),(72,'admin သည် purchase အားအသစ်သွင်းသွားသည်။',1,'2025-08-31 00:41:01',NULL),(73,'adminသည် purchase photo အား update လုပ်သွားသည်။',1,'2025-08-31 00:41:52',NULL),(74,'admin သည် purchase အားအသစ်သွင်းသွားသည်။',1,'2025-08-31 00:44:54',NULL),(75,'admin သည် purchase အားအသစ်သွင်းသွားသည်။',1,'2025-08-31 00:46:45',NULL),(76,'admin သည် purchase အားအသစ်သွင်းသွားသည်။',1,'2025-08-31 00:50:51',NULL),(77,'admin သည် purchase အားအသစ်သွင်းသွားသည်။',1,'2025-08-31 00:52:28',NULL),(78,'admin သည် purchase အားအသစ်သွင်းသွားသည်။',1,'2025-08-31 00:53:58',NULL),(79,'admin သည် purchase အားအသစ်သွင်းသွားသည်။',1,'2025-08-31 00:55:35',NULL),(80,'admin သည် purchase အားအသစ်သွင်းသွားသည်။',1,'2025-08-31 00:57:09',NULL),(81,'adminLogout လုပ်သွားသည်',1,'2025-09-01 11:42:18',NULL),(82,'admin Login ဝင်သွားသည်',1,'2025-09-01 11:42:35',NULL),(83,'admin သည် purchase အားအသစ်သွင်းသွားသည်။',1,'2025-09-01 11:45:36',NULL),(84,'admin သည် purchase အားအသစ်သွင်းသွားသည်။',1,'2025-09-01 11:49:39',NULL),(85,'admin သည် purchase အားအသစ်သွင်းသွားသည်။',1,'2025-09-01 11:50:50',NULL),(86,'adminသည် purchase အား update လုပ်သွားသည်။',1,'2025-09-01 11:50:57',NULL),(87,'admin သည် purchase အားဖျက်သွားသည်။',1,'2025-09-01 11:53:14',NULL),(88,'admin သည် purchase အားအသစ်သွင်းသွားသည်။',1,'2025-09-01 11:53:23',NULL),(89,'admin သည် purchase အားအသစ်သွင်းသွားသည်။',1,'2025-09-01 12:00:31',NULL),(90,'adminသည် purchase အား update လုပ်သွားသည်။',1,'2025-09-01 12:00:56',NULL),(91,'admin သည် purchase အားအသစ်သွင်းသွားသည်။',1,'2025-09-01 12:02:34',NULL),(92,'admin သည် purchase အားအသစ်သွင်းသွားသည်။',1,'2025-09-01 12:05:41',NULL),(93,'admin သည် purchase အားအသစ်သွင်းသွားသည်။',1,'2025-09-01 12:09:12',NULL),(94,'adminသည် purchase အား update လုပ်သွားသည်။',1,'2025-09-01 12:09:42',NULL),(95,'admin သည် purchase အားအသစ်သွင်းသွားသည်။',1,'2025-09-01 12:10:22',NULL),(96,'admin သည် purchase အားအသစ်သွင်းသွားသည်။',1,'2025-09-01 12:17:03',NULL),(97,'admin သည် purchase အားအသစ်သွင်းသွားသည်။',1,'2025-09-01 12:19:01',NULL),(98,'admin သည် purchase အားအသစ်သွင်းသွားသည်။',1,'2025-09-01 12:22:08',NULL),(99,'adminသည် purchase အား update လုပ်သွားသည်။',1,'2025-09-01 12:22:21',NULL),(100,'adminသည် purchase အား update လုပ်သွားသည်။',1,'2025-09-01 12:22:28',NULL),(101,'admin သည် purchase အားအသစ်သွင်းသွားသည်။',1,'2025-09-01 12:23:06',NULL),(102,'admin သည် purchase အားအသစ်သွင်းသွားသည်။',1,'2025-09-01 12:24:02',NULL),(103,'adminသည် purchase အား update လုပ်သွားသည်။',1,'2025-09-01 12:24:19',NULL),(104,'admin သည် purchase အားအသစ်သွင်းသွားသည်။',1,'2025-09-01 12:26:49',NULL),(105,'admin သည် purchase အားအသစ်သွင်းသွားသည်။',1,'2025-09-01 12:28:33',NULL),(106,'admin သည် purchase အားအသစ်သွင်းသွားသည်။',1,'2025-09-01 12:30:28',NULL),(107,'admin သည် purchase အားအသစ်သွင်းသွားသည်။',1,'2025-09-01 12:31:20',NULL),(108,'admin သည် purchase အားအသစ်သွင်းသွားသည်။',1,'2025-09-01 12:32:43',NULL),(109,'admin သည် purchase အားအသစ်သွင်းသွားသည်။',1,'2025-09-01 12:36:49',NULL),(110,'admin သည် purchase အားအသစ်သွင်းသွားသည်။',1,'2025-09-01 14:23:01',NULL),(111,'admin သည် purchase အားအသစ်သွင်းသွားသည်။',1,'2025-09-01 14:23:48',NULL),(112,'admin သည် purchase အားအသစ်သွင်းသွားသည်။',1,'2025-09-01 14:24:13',NULL),(113,'admin သည် purchase အားဖျက်သွားသည်။',1,'2025-09-01 14:24:21',NULL),(114,'admin သည် purchase အားအသစ်သွင်းသွားသည်။',1,'2025-09-01 14:25:35',NULL),(115,'adminသည် purchase အား update လုပ်သွားသည်။',1,'2025-09-01 14:31:22',NULL),(116,'admin သည် purchase အားအသစ်သွင်းသွားသည်။',1,'2025-09-01 14:36:06',NULL),(117,'admin သည် purchase အားအသစ်သွင်းသွားသည်။',1,'2025-09-01 14:38:31',NULL),(118,'admin သည် purchase အားအသစ်သွင်းသွားသည်။',1,'2025-09-01 14:40:42',NULL),(119,'admin သည် purchase အားအသစ်သွင်းသွားသည်။',1,'2025-09-01 14:43:12',NULL),(120,'admin သည် purchase အားအသစ်သွင်းသွားသည်။',1,'2025-09-01 14:44:36',NULL),(121,'admin သည် purchase အားအသစ်သွင်းသွားသည်။',1,'2025-09-01 14:46:33',NULL),(122,'admin သည် purchase အားအသစ်သွင်းသွားသည်။',1,'2025-09-01 14:47:42',NULL),(123,'admin သည် purchase အားအသစ်သွင်းသွားသည်။',1,'2025-09-01 14:49:22',NULL),(124,'admin သည် purchase အားအသစ်သွင်းသွားသည်။',1,'2025-09-01 14:51:31',NULL),(125,'admin သည် purchase အားအသစ်သွင်းသွားသည်။',1,'2025-09-01 14:58:11',NULL),(126,'adminLogout လုပ်သွားသည်',1,'2025-09-02 21:37:46',NULL),(127,'admin Login ဝင်သွားသည်',1,'2025-09-02 21:37:56',NULL),(128,'adminLogout လုပ်သွားသည်',1,'2025-09-02 21:38:23',NULL),(129,'admin Login ဝင်သွားသည်',1,'2025-09-02 21:38:28',NULL),(130,'admin သည် purchase အားအသစ်သွင်းသွားသည်။',1,'2025-09-02 21:47:50',NULL),(131,'admin သည် purchase အားအသစ်သွင်းသွားသည်။',1,'2025-09-02 21:54:54',NULL),(132,'adminသည် purchase အား update လုပ်သွားသည်။',1,'2025-09-02 21:55:49',NULL),(133,'admin သည် purchase အားအသစ်သွင်းသွားသည်။',1,'2025-09-02 21:56:27',NULL),(134,'admin သည် purchase အားအသစ်သွင်းသွားသည်။',1,'2025-09-02 21:57:44',NULL),(135,'admin သည် purchase အားအသစ်သွင်းသွားသည်။',1,'2025-09-02 21:59:32',NULL),(136,'admin သည် purchase အားအသစ်သွင်းသွားသည်။',1,'2025-09-02 22:00:37',NULL),(137,'admin သည် purchase အားအသစ်သွင်းသွားသည်။',1,'2025-09-02 22:01:42',NULL),(138,'admin သည် purchase အားဖျက်သွားသည်။',1,'2025-09-02 22:01:55',NULL),(139,'admin သည် purchase အားအသစ်သွင်းသွားသည်။',1,'2025-09-02 22:02:12',NULL),(140,'admin သည် purchase အားအသစ်သွင်းသွားသည်။',1,'2025-09-02 22:03:57',NULL),(141,'admin သည် purchase အားအသစ်သွင်းသွားသည်။',1,'2025-09-02 22:06:13',NULL),(142,'admin သည် purchase အားအသစ်သွင်းသွားသည်။',1,'2025-09-02 22:08:08',NULL),(143,'adminသည် purchase အား update လုပ်သွားသည်။',1,'2025-09-02 22:08:30',NULL),(144,'admin သည် purchase အားအသစ်သွင်းသွားသည်။',1,'2025-09-02 22:10:02',NULL),(145,'admin သည် purchase အားအသစ်သွင်းသွားသည်။',1,'2025-09-02 22:11:43',NULL),(146,'admin သည် purchase အားအသစ်သွင်းသွားသည်။',1,'2025-09-02 22:12:52',NULL),(147,'admin သည် purchase အားအသစ်သွင်းသွားသည်။',1,'2025-09-02 22:14:07',NULL),(148,'admin သည် purchase အားအသစ်သွင်းသွားသည်။',1,'2025-09-02 22:15:22',NULL),(149,'admin သည် purchase အားအသစ်သွင်းသွားသည်။',1,'2025-09-02 22:16:57',NULL),(150,'admin သည် purchase အားအသစ်သွင်းသွားသည်။',1,'2025-09-02 22:17:54',NULL),(151,'admin သည် purchase အားအသစ်သွင်းသွားသည်။',1,'2025-09-02 22:24:10',NULL),(152,'admin သည် purchase အားအသစ်သွင်းသွားသည်။',1,'2025-09-02 22:26:15',NULL),(153,'admin သည် purchase အားအသစ်သွင်းသွားသည်။',1,'2025-09-02 22:28:45',NULL),(154,'admin သည် purchase အားအသစ်သွင်းသွားသည်။',1,'2025-09-02 22:30:12',NULL),(155,'admin သည် purchase အားအသစ်သွင်းသွားသည်။',1,'2025-09-02 22:31:39',NULL),(156,'admin သည် purchase အားအသစ်သွင်းသွားသည်။',1,'2025-09-02 22:32:48',NULL),(157,'admin သည် purchase အားအသစ်သွင်းသွားသည်။',1,'2025-09-02 22:34:19',NULL),(158,'admin သည် purchase အားအသစ်သွင်းသွားသည်။',1,'2025-09-02 22:35:47',NULL),(159,'admin သည် user အားအသစ်သွင်းသွားသည်။',1,'2025-09-02 22:37:04',NULL),(160,'adminသည် purchase အား update လုပ်သွားသည်။',1,'2025-09-02 22:41:03',NULL),(161,'adminသည် purchase အား update လုပ်သွားသည်။',1,'2025-09-02 22:41:08',NULL),(162,'admin သည် purchase အားအသစ်သွင်းသွားသည်။',1,'2025-09-02 22:44:11',NULL),(163,'admin သည် vno: 20250902-224511 ဖြင့် cash အရောင်းသွင်းသွားသည်။',1,'2025-09-02 22:45:11',NULL),(164,'adminLogout လုပ်သွားသည်',1,'2025-09-03 11:19:13',NULL),(165,'admin Login ဝင်သွားသည်',1,'2025-09-03 11:19:18',NULL),(166,'admin သည် user အားအသစ်သွင်းသွားသည်။',1,'2025-09-03 16:07:42',NULL),(167,'admin သည် vno: 20250903-160836 ဖြင့် cash အရောင်းသွင်းသွားသည်။',1,'2025-09-03 16:08:36',NULL),(168,'admin သည် user အားအသစ်သွင်းသွားသည်။',1,'2025-09-03 16:10:19',NULL),(169,'admin သည် user အားအသစ်သွင်းသွားသည်။',1,'2025-09-03 16:13:02',NULL),(170,'admin Login ဝင်သွားသည်',1,'2025-09-09 10:24:39',NULL),(171,'admin Login ဝင်သွားသည်',1,'2025-09-12 11:15:44',NULL),(172,'admin Login ဝင်သွားသည်',1,'2025-09-12 11:17:29',NULL),(173,'admin Login ဝင်သွားသည်',1,'2025-09-12 11:19:43',NULL),(174,'adminLogout လုပ်သွားသည်',1,'2025-09-12 11:20:08',NULL),(175,'admin Login ဝင်သွားသည်',1,'2025-09-12 11:21:30',NULL),(176,'admin Login ဝင်သွားသည်',1,'2025-09-12 11:24:44',NULL),(177,'adminLogout လုပ်သွားသည်',1,'2025-09-12 11:24:57',NULL),(178,'admin Login ဝင်သွားသည်',1,'2025-09-12 11:33:46',NULL),(179,'admin Login ဝင်သွားသည်',1,'2025-09-12 12:54:21',NULL),(180,'admin Login ဝင်သွားသည်',1,'2025-09-12 12:55:00',NULL),(181,'admin Login ဝင်သွားသည်',1,'2025-09-12 13:16:47',NULL),(182,'admin Login ဝင်သွားသည်',1,'2025-09-12 13:19:26',NULL),(183,'admin သည် purchase အားအသစ်သွင်းသွားသည်။',1,'2025-09-12 13:29:07',NULL),(184,'admin သည် purchase အားအသစ်သွင်းသွားသည်။',1,'2025-09-12 13:30:30',NULL),(185,'admin သည် purchase အားအသစ်သွင်းသွားသည်။',1,'2025-09-12 13:32:12',NULL),(186,'admin သည် purchase အားအသစ်သွင်းသွားသည်။',1,'2025-09-12 13:33:36',NULL),(187,'admin သည် purchase အားအသစ်သွင်းသွားသည်။',1,'2025-09-12 13:41:25',NULL),(188,'admin သည် purchase အားအသစ်သွင်းသွားသည်။',1,'2025-09-12 13:42:51',NULL),(189,'admin သည် purchase အားအသစ်သွင်းသွားသည်။',1,'2025-09-12 13:44:08',NULL),(190,'admin သည် purchase အားအသစ်သွင်းသွားသည်။',1,'2025-09-12 13:47:28',NULL),(191,'admin သည် purchase အားအသစ်သွင်းသွားသည်။',1,'2025-09-12 13:50:56',NULL),(192,'admin သည် purchase အားအသစ်သွင်းသွားသည်။',1,'2025-09-12 13:52:24',NULL),(193,'admin သည် purchase အားအသစ်သွင်းသွားသည်။',1,'2025-09-12 13:53:45',NULL),(194,'admin သည် purchase အားအသစ်သွင်းသွားသည်။',1,'2025-09-12 13:56:46',NULL),(195,'admin သည် category အားအသစ်သွင်းသွားသည်။',1,'2025-09-12 13:57:10',NULL),(196,'adminသည် purchase အား update လုပ်သွားသည်။',1,'2025-09-12 13:57:36',NULL),(197,'admin သည် purchase အားအသစ်သွင်းသွားသည်။',1,'2025-09-12 13:59:09',NULL),(198,'admin သည် purchase အားအသစ်သွင်းသွားသည်။',1,'2025-09-12 14:00:45',NULL),(199,'admin သည် purchase အားအသစ်သွင်းသွားသည်။',1,'2025-09-12 14:04:15',NULL),(200,'admin သည် purchase အားအသစ်သွင်းသွားသည်။',1,'2025-09-12 14:07:25',NULL),(201,'admin သည် purchase အားအသစ်သွင်းသွားသည်။',1,'2025-09-12 14:20:05',NULL),(202,'admin သည် purchase အားအသစ်သွင်းသွားသည်။',1,'2025-09-12 14:20:57',NULL),(203,'admin သည် purchase အားအသစ်သွင်းသွားသည်။',1,'2025-09-12 14:37:37',NULL),(204,'admin သည် purchase အားအသစ်သွင်းသွားသည်။',1,'2025-09-12 14:46:18',NULL),(205,'admin သည် user အားအသစ်သွင်းသွားသည်။',1,'2025-09-12 14:49:48',NULL),(206,'admin သည် vno: 20250912-145141 ဖြင့် credit အရောင်းသွင်းသွားသည်။',1,'2025-09-12 14:51:41',NULL),(207,'adminသည် user အား update လုပ်သွားသည်။',1,'2025-09-12 14:55:57',NULL),(208,'adminLogout လုပ်သွားသည်',1,'2025-09-12 14:56:07',NULL),(209,'MMS Login ဝင်သွားသည်',1,'2025-09-12 14:56:24',NULL),(210,'MMS သည် Print setting ကိုပြန်လည်ပြင်ဆင်သွားသည်။',1,'2025-09-12 14:58:40',NULL),(211,'MMSသည် supplier အား update လုပ်သွားသည်။',1,'2025-09-12 14:59:52',NULL),(212,'MMS သည် Print setting ကိုပြန်လည်ပြင်ဆင်သွားသည်။',1,'2025-09-12 15:00:43',NULL),(213,'MMS သည် user အားအသစ်သွင်းသွားသည်။',1,'2025-09-12 15:02:54',NULL),(214,'MMS သည် vno: 20250912-151527 ဖြင့် credit အရောင်းသွင်းသွားသည်။',1,'2025-09-12 15:15:27',NULL),(215,'MMS သည် vno: 20250912-151719 ဖြင့် credit အရောင်းသွင်းသွားသည်။',1,'2025-09-12 15:17:19',NULL),(216,'MMS သည် user အားအသစ်သွင်းသွားသည်။',1,'2025-09-12 15:18:05',NULL),(217,'MMS သည် vno: 20250912-152048 ဖြင့် cash အရောင်းသွင်းသွားသည်။',1,'2025-09-12 15:20:48',NULL),(218,'MMS သည် user အားအသစ်သွင်းသွားသည်။',1,'2025-09-12 15:21:33',NULL),(219,'MMS သည် vno: 20250912-152211 ဖြင့် credit အရောင်းသွင်းသွားသည်။',1,'2025-09-12 15:22:11',NULL),(220,'MMS သည် user အားအသစ်သွင်းသွားသည်။',1,'2025-09-12 15:23:21',NULL),(221,'MMS သည် vno: 20250912-152504 ဖြင့် credit အရောင်းသွင်းသွားသည်။',1,'2025-09-12 15:25:04',NULL),(222,'MMS သည် vno: 20250912-152557 ဖြင့် credit အရောင်းသွင်းသွားသည်။',1,'2025-09-12 15:25:57',NULL),(223,'MMS သည် vno: 20250912-153002 ဖြင့် cash အရောင်းသွင်းသွားသည်။',1,'2025-09-12 15:30:02',NULL),(224,'MMS Login ဝင်သွားသည်',1,'2025-09-15 00:36:28',NULL),(225,'MMS Login ဝင်သွားသည်',1,'2025-09-15 13:22:20',NULL),(226,'MMS Login ဝင်သွားသည်',1,'2025-09-15 13:22:44',NULL),(227,'MMS Login ဝင်သွားသည်',1,'2025-09-16 12:31:49',NULL),(228,'MMS Login ဝင်သွားသည်',1,'2025-09-16 15:11:52',NULL),(229,'MMS သည် purchase အားအသစ်သွင်းသွားသည်။',1,'2025-09-16 15:20:25',NULL),(230,'MMS သည် purchase အားအသစ်သွင်းသွားသည်။',1,'2025-09-16 15:22:16',NULL),(231,'MMS သည် purchase အားအသစ်သွင်းသွားသည်။',1,'2025-09-16 15:24:39',NULL),(232,'MMS သည် purchase အားအသစ်သွင်းသွားသည်။',1,'2025-09-16 15:28:30',NULL),(233,'MMS သည် purchase အားအသစ်သွင်းသွားသည်။',1,'2025-09-16 15:29:36',NULL),(234,'MMSသည် purchase အား update လုပ်သွားသည်။',1,'2025-09-16 15:29:49',NULL),(235,'MMS Login ဝင်သွားသည်',1,'2025-09-16 15:32:12',NULL),(236,'MMS သည် vno: 20250916-154522 ဖြင့် credit အရောင်းသွင်းသွားသည်။',1,'2025-09-16 15:45:22',NULL),(237,'MMS သည် user အားအသစ်သွင်းသွားသည်။',1,'2025-09-16 15:46:27',NULL),(238,'MMSသည် purchase အား update လုပ်သွားသည်။',1,'2025-09-16 15:58:01',NULL),(239,'MMS သည် vno: 20250916-155924 ဖြင့် cash အရောင်းသွင်းသွားသည်။',1,'2025-09-16 15:59:24',NULL),(240,'MMS Login ဝင်သွားသည်',1,'2025-09-17 14:20:31',NULL),(241,'MMS Login ဝင်သွားသည်',1,'2025-09-18 13:00:49',NULL),(242,'MMS Login ဝင်သွားသည်',1,'2025-09-18 13:03:36',NULL),(243,'MMS Login ဝင်သွားသည်',1,'2025-09-18 14:58:30',NULL),(244,'MMS သည် user အားအသစ်သွင်းသွားသည်။',1,'2025-09-18 15:01:08',NULL),(245,'MMS သည် user အားအသစ်သွင်းသွားသည်။',1,'2025-09-18 15:01:11',NULL),(246,'MMS Login ဝင်သွားသည်',1,'2025-09-18 15:02:20',NULL),(247,'MMS Login ဝင်သွားသည်',1,'2025-09-18 15:02:42',NULL),(248,'MMS Login ဝင်သွားသည်',1,'2025-09-18 15:03:32',NULL),(249,'MMS Login ဝင်သွားသည်',1,'2025-09-19 11:07:34',NULL),(250,'MMS သည် user အားအသစ်သွင်းသွားသည်။',1,'2025-09-19 11:10:12',NULL),(251,'MMS သည် user အားဖျက်သွားသည်။',1,'2025-09-19 11:10:26',NULL),(252,'MMS သည် user အားဖျက်သွားသည်။',1,'2025-09-19 11:10:32',NULL),(253,'MMSLogout လုပ်သွားသည်',1,'2025-09-19 11:10:45',NULL),(254,'Guest Login ဝင်သွားသည်',4,'2025-09-19 11:11:05',NULL),(255,'MMS Login ဝင်သွားသည်',2,'2025-09-19 11:32:39',NULL),(256,'MMSLogout လုပ်သွားသည်',2,'2025-09-19 11:53:53',NULL),(257,'MMS Login ဝင်သွားသည်',2,'2025-09-19 11:54:15',NULL),(258,'MMS Login ဝင်သွားသည်',2,'2025-09-19 11:55:59',NULL),(259,'MMSLogout လုပ်သွားသည်',2,'2025-09-19 12:01:08',NULL),(260,'MMS Login ဝင်သွားသည်',2,'2025-09-19 12:01:24',NULL),(261,'MMSLogout လုပ်သွားသည်',2,'2025-09-19 12:42:29',NULL),(262,'MMS Login ဝင်သွားသည်',2,'2025-09-19 12:42:49',NULL),(263,'MMS Login ဝင်သွားသည်',2,'2025-09-19 15:16:52',NULL),(264,'MMS Login ဝင်သွားသည်',1,'2025-09-19 17:00:18',NULL),(265,'MMS Login ဝင်သွားသည်',1,'2025-09-20 14:20:46',NULL),(266,'MMS သည် purchase အားအသစ်သွင်းသွားသည်။',1,'2025-09-20 14:30:16',NULL),(267,'MMS သည် purchase အားအသစ်သွင်းသွားသည်။',1,'2025-09-20 14:53:19',NULL),(268,'MMS သည် purchase အားအသစ်သွင်းသွားသည်။',1,'2025-09-20 14:54:36',NULL),(269,'MMSသည် purchase အား update လုပ်သွားသည်။',1,'2025-09-20 14:54:55',NULL),(270,'MMS သည် purchase အားအသစ်သွင်းသွားသည်။',1,'2025-09-20 14:56:57',NULL),(271,'MMS သည် purchase အားအသစ်သွင်းသွားသည်။',1,'2025-09-20 14:58:11',NULL),(272,'MMS သည် purchase အားအသစ်သွင်းသွားသည်။',1,'2025-09-20 14:58:57',NULL),(273,'MMS သည် purchase အားဖျက်သွားသည်။',1,'2025-09-20 14:59:19',NULL),(274,'MMS သည် purchase အားအသစ်သွင်းသွားသည်။',1,'2025-09-20 14:59:35',NULL),(275,'MMS သည် purchase အားအသစ်သွင်းသွားသည်။',1,'2025-09-20 15:00:40',NULL),(276,'MMS သည် purchase အားအသစ်သွင်းသွားသည်။',1,'2025-09-20 15:01:27',NULL),(277,'MMS သည် purchase အားအသစ်သွင်းသွားသည်။',1,'2025-09-20 15:02:28',NULL),(278,'MMS သည် purchase အားအသစ်သွင်းသွားသည်။',1,'2025-09-20 15:04:34',NULL),(279,'MMS သည် purchase အားအသစ်သွင်းသွားသည်။',1,'2025-09-20 15:06:31',NULL),(280,'MMS သည် purchase အားအသစ်သွင်းသွားသည်။',1,'2025-09-20 15:07:41',NULL),(281,'MMS သည် user အားအသစ်သွင်းသွားသည်။',1,'2025-09-20 15:09:46',NULL),(282,'MMS သည် purchase အားအသစ်သွင်းသွားသည်။',1,'2025-09-20 15:18:45',NULL),(283,'MMSသည် purchase အား update လုပ်သွားသည်။',1,'2025-09-20 15:18:58',NULL),(284,'MMS သည် vno: 20250920-151951 ဖြင့် cash အရောင်းသွင်းသွားသည်။',1,'2025-09-20 15:19:51',NULL),(285,'MMS သည် vno: 20250920-152142 ဖြင့် credit အရောင်းသွင်းသွားသည်။',1,'2025-09-20 15:21:42',NULL),(286,'MMS သည် vno: 20250920-152253 ဖြင့် credit အရောင်းသွင်းသွားသည်။',1,'2025-09-20 15:22:53',NULL),(287,'MMS သည် user အားအသစ်သွင်းသွားသည်။',1,'2025-09-20 15:23:51',NULL),(288,'MMS သည် vno: 20250920-152433 ဖြင့် credit အရောင်းသွင်းသွားသည်။',1,'2025-09-20 15:24:33',NULL),(289,'MMSသည် purchase အား update လုပ်သွားသည်။',1,'2025-09-20 15:25:58',NULL),(290,'MMS သည် user အားအသစ်သွင်းသွားသည်။',1,'2025-09-20 15:26:59',NULL),(291,'MMS သည် vno: 20250920-152718 ဖြင့် cash အရောင်းသွင်းသွားသည်။',1,'2025-09-20 15:27:18',NULL),(292,'MMS သည် purchase အားအသစ်သွင်းသွားသည်။',1,'2025-09-20 15:34:31',NULL),(293,'MMS သည် vno: 20250920-153510 ဖြင့် credit အရောင်းသွင်းသွားသည်။',1,'2025-09-20 15:35:10',NULL),(294,'MMS သည် vno: 20250920-153546 ဖြင့် credit အရောင်းသွင်းသွားသည်။',1,'2025-09-20 15:35:46',NULL),(295,'MMS သည် purchase အားအသစ်သွင်းသွားသည်။',1,'2025-09-20 15:38:03',NULL),(296,'MMS သည် user အားအသစ်သွင်းသွားသည်။',1,'2025-09-20 15:39:02',NULL),(297,'MMS သည် vno: 20250920-153931 ဖြင့် credit အရောင်းသွင်းသွားသည်။',1,'2025-09-20 15:39:31',NULL),(298,'MMS သည် user အားအသစ်သွင်းသွားသည်။',1,'2025-09-20 15:40:16',NULL),(299,'MMS သည် vno: 20250920-154123 ဖြင့် credit အရောင်းသွင်းသွားသည်။',1,'2025-09-20 15:41:23',NULL),(300,'MMS Login ဝင်သွားသည်',1,'2025-09-21 16:32:55',NULL),(301,'MMS Login ဝင်သွားသည်',1,'2025-09-21 17:39:48',NULL),(302,'MMS Login ဝင်သွားသည်',1,'2025-09-21 19:16:41',NULL),(303,'MMS Login ဝင်သွားသည်',1,'2025-09-22 11:12:28',NULL),(304,'MMS Login ဝင်သွားသည်',1,'2025-09-22 11:35:07',NULL),(305,'MMS သည် vno: 20250922-115508 ဖြင့် credit အရောင်းသွင်းသွားသည်။',1,'2025-09-22 11:55:08',NULL),(306,'MMS သည် vno: 20250922-115947 ဖြင့် cash အရောင်းသွင်းသွားသည်။',1,'2025-09-22 11:59:47',NULL),(307,'MMS သည် vno: 20250922-115947 ၏ cash အရောင်းစာရင်းအားဖျက်သွားသည်။',1,'2025-09-22 12:00:41',NULL),(308,'MMS သည် vno: 20250922-115508 ၏ credit အရောင်းစာရင်းအားဖျက်သွားသည်။',1,'2025-09-22 12:19:45',NULL),(309,'MMSသည် purchase အား update လုပ်သွားသည်။',1,'2025-09-22 12:34:22',NULL),(310,'MMS သည် user အားအသစ်သွင်းသွားသည်။',1,'2025-09-22 12:47:39',NULL),(311,'MMS သည် user အားအသစ်သွင်းသွားသည်။',1,'2025-09-22 13:01:04',NULL),(312,'MMS သည် customer အားဖျက်သွားသည်။',1,'2025-09-22 13:01:45',NULL),(313,'MMS သည် vno: 20250922-130400 ဖြင့် credit အရောင်းသွင်းသွားသည်။',1,'2025-09-22 13:04:00',NULL),(314,'MMSသည် Customer Credit Pay အား Savae လုပ်သွားသည်။',1,'2025-09-22 13:23:47',NULL),(315,'MMSသည် Customer Credit Pay အား Savae လုပ်သွားသည်။',1,'2025-09-22 13:24:36',NULL),(316,'MMSသည် Supplier Pay အား Delete လုပ်သွားသည်။',1,'2025-09-22 13:25:50',NULL),(317,'MMSသည် Supplier Pay အား Delete လုပ်သွားသည်။',1,'2025-09-22 13:25:54',NULL),(318,'MMSသည် Customer Credit Pay အား Savae လုပ်သွားသည်။',1,'2025-09-22 13:31:12',NULL),(319,'MMSသည် Customer Credit Pay အား Savae လုပ်သွားသည်။',1,'2025-09-22 13:31:14',NULL),(320,'MMSသည် Supplier Pay အား Delete လုပ်သွားသည်။',1,'2025-09-22 13:31:19',NULL),(321,'MMSသည် Customer Credit Pay အား Savae လုပ်သွားသည်။',1,'2025-09-22 13:33:46',NULL),(322,'MMS သည် vno: 20250922-130400 ၏ credit အရောင်းစာရင်းအားဖျက်သွားသည်။',1,'2025-09-22 13:36:21',NULL),(323,'MMSသည် Supplier Pay အား Delete လုပ်သွားသည်။',1,'2025-09-22 13:37:11',NULL),(324,'MMSသည် Supplier Pay အား Delete လုပ်သွားသည်။',1,'2025-09-22 13:37:14',NULL),(325,'MMS Login ဝင်သွားသည်',1,'2025-09-22 13:51:04',NULL),(326,'MMS Login ဝင်သွားသည်',1,'2025-09-22 17:38:37',NULL),(327,'MMS Login ဝင်သွားသည်',1,'2025-09-23 09:29:47',NULL),(328,'MMS Login ဝင်သွားသည်',1,'2025-09-23 11:16:22',NULL),(329,'MMS Login ဝင်သွားသည်',1,'2025-09-23 12:12:43',NULL),(330,'MMS Login ဝင်သွားသည်',1,'2025-09-23 17:09:28',NULL),(331,'MMS Login ဝင်သွားသည်',1,'2025-09-24 10:38:26',NULL),(332,'MMS သည် vno: 20250924-123814 ဖြင့် credit အရောင်းသွင်းသွားသည်။',1,'2025-09-24 12:38:14',NULL),(333,'MMS Login ဝင်သွားသည်',1,'2025-09-25 09:46:44',NULL),(334,'MMS Login ဝင်သွားသည်',1,'2025-09-25 20:31:35',NULL),(335,'MMS Login ဝင်သွားသည်',1,'2025-09-25 22:15:43',NULL),(336,'MMS သည် user အားအသစ်သွင်းသွားသည်။',1,'2025-09-25 22:16:52',NULL),(337,'MMS သည် user အားအသစ်သွင်းသွားသည်။',1,'2025-09-25 22:17:20',NULL),(338,'MMS သည် vno: 20250925-221742 ဖြင့် cash အရောင်းသွင်းသွားသည်။',1,'2025-09-25 22:17:42',NULL),(339,'MMS Login ဝင်သွားသည်',1,'2025-09-26 15:41:35',NULL),(340,'MMS သည် user အားအသစ်သွင်းသွားသည်။',1,'2025-09-26 15:43:55',NULL),(341,'MMS သည် vno: 20250926-154644 ဖြင့် credit အရောင်းသွင်းသွားသည်။',1,'2025-09-26 15:46:44',NULL),(342,'MMS သည် user အားအသစ်သွင်းသွားသည်။',1,'2025-09-26 15:47:41',NULL),(343,'MMS သည် user အားအသစ်သွင်းသွားသည်။',1,'2025-09-26 15:54:35',NULL),(344,'MMS သည် vno: 20250926-155526 ဖြင့် credit အရောင်းသွင်းသွားသည်။',1,'2025-09-26 15:55:26',NULL),(345,'MMS သည် purchase အားအသစ်သွင်းသွားသည်။',1,'2025-09-26 15:59:20',NULL),(346,'MMS သည် purchase အားအသစ်သွင်းသွားသည်။',1,'2025-09-26 16:00:06',NULL),(347,'MMS သည် purchase အားအသစ်သွင်းသွားသည်။',1,'2025-09-26 16:13:17',NULL),(348,'MMS Login ဝင်သွားသည်',1,'2025-09-27 09:35:11',NULL),(349,'MMS Login ဝင်သွားသည်',1,'2025-09-27 11:15:19',NULL),(350,'MMS သည် vno: 20250927-113719 ဖြင့် credit အရောင်းသွင်းသွားသည်။',1,'2025-09-27 11:37:19',NULL),(351,'MMS သည် user အားအသစ်သွင်းသွားသည်။',1,'2025-09-27 12:06:00',NULL),(352,'MMS သည် vno: 20250927-123608 ဖြင့် credit အရောင်းသွင်းသွားသည်။',1,'2025-09-27 12:36:08',NULL),(353,'MMS သည် user အားအသစ်သွင်းသွားသည်။',1,'2025-09-27 12:37:20',NULL),(354,'MMS သည် vno: 20250927-123902 ဖြင့် credit အရောင်းသွင်းသွားသည်။',1,'2025-09-27 12:39:02',NULL),(355,'MMS Login ဝင်သွားသည်',1,'2025-09-27 13:55:03',NULL),(356,'MMS Login ဝင်သွားသည်',1,'2025-09-27 14:02:01',NULL),(357,'MMS Login ဝင်သွားသည်',1,'2025-09-27 14:03:29',NULL),(358,'MMS Login ဝင်သွားသည်',1,'2025-09-27 14:05:59',NULL),(359,'MMS Login ဝင်သွားသည်',1,'2025-09-27 14:06:18',NULL),(360,'MMS Login ဝင်သွားသည်',1,'2025-09-27 14:15:11',NULL),(361,'MMS သည် vno: 20250926-155526 ၏ credit အရောင်းစာရင်းအားဖျက်သွားသည်။',1,'2025-09-27 14:53:59',NULL),(362,'MMS သည် vno: 20250927-145522 ဖြင့် credit အရောင်းသွင်းသွားသည်။',1,'2025-09-27 14:55:22',NULL),(363,'MMS သည် vno: 20250927-145747 ဖြင့် credit အရောင်းသွင်းသွားသည်။',1,'2025-09-27 14:57:47',NULL),(364,'MMS Login ဝင်သွားသည်',1,'2025-09-27 15:37:55',NULL),(365,'MMS သည် vno: 20250927-153837 ဖြင့် credit အရောင်းသွင်းသွားသည်။',1,'2025-09-27 15:38:37',NULL),(366,'MMS သည် vno: 20250927-164400 ဖြင့် cash အရောင်းသွင်းသွားသည်။',1,'2025-09-27 16:44:00',NULL),(367,'MMS Login ဝင်သွားသည်',1,'2025-09-28 09:16:19',NULL),(368,'MMS သည် purchase အားအသစ်သွင်းသွားသည်။',1,'2025-09-28 09:21:17',NULL),(369,'MMS သည် purchase အားအသစ်သွင်းသွားသည်။',1,'2025-09-28 09:22:59',NULL),(370,'MMS Login ဝင်သွားသည်',1,'2025-09-28 10:18:23',NULL),(371,'MMS သည် vno: 20250928-105109 ဖြင့် cash အရောင်းသွင်းသွားသည်။',1,'2025-09-28 10:51:09',NULL),(372,'admin Login ဝင်သွားသည်',1,'2025-09-28 17:32:30',NULL),(373,'admin သည် Print setting ကိုပြန်လည်ပြင်ဆင်သွားသည်။',1,'2025-09-28 18:00:26',NULL),(374,'admin သည် vno: 20250928-214158 ဖြင့် cash အရောင်းသွင်းသွားသည်။',1,'2025-09-28 21:41:58',NULL),(375,'adminသည် Customer Credit Pay အား Save လုပ်သွားသည်။',1,'2025-09-28 22:16:46',NULL),(376,'adminသည် Customer Credit Pay အား Save လုပ်သွားသည်။',1,'2025-09-28 22:16:59',NULL),(377,'admin Login ဝင်သွားသည်',1,'2025-09-28 23:00:45',NULL),(378,'admin Login ဝင်သွားသည်',1,'2025-09-29 09:59:41',NULL),(379,'admin Login ဝင်သွားသည်',1,'2025-09-29 13:06:59',NULL),(380,'adminသည် Customer Credit Pay အား Save လုပ်သွားသည်။',1,'2025-09-29 13:08:20',NULL),(381,'admin Login ဝင်သွားသည်',1,'2025-09-29 16:30:06',NULL),(382,'admin Login ဝင်သွားသည်',1,'2025-09-29 19:21:58',NULL),(383,'admin သည် expense category အားအသစ်သွင်းသွားသည်။',1,'2025-09-29 19:25:42',NULL),(384,'admin သည် expense category အားအသစ်သွင်းသွားသည်။',1,'2025-09-29 19:25:46',NULL),(385,'admin Login ဝင်သွားသည်',1,'2025-09-29 21:00:44',NULL),(386,'admin သည် Print setting ကိုပြန်လည်ပြင်ဆင်သွားသည်။',1,'2025-09-29 21:44:44',NULL),(387,'admin သည် vno: 20250929-221124 ဖြင့် cash အရောင်းသွင်းသွားသည်။',1,'2025-09-29 22:11:24',NULL),(388,'admin သည် vno: 20250929-221346 ဖြင့် cash အရောင်းသွင်းသွားသည်။',1,'2025-09-29 22:13:46',NULL),(389,'admin သည် vno: 20250929-222752 ဖြင့် cash အရောင်းသွင်းသွားသည်။',1,'2025-09-29 22:27:52',NULL),(390,'admin သည် vno: 20250929-222956 ဖြင့် credit အရောင်းသွင်းသွားသည်။',1,'2025-09-29 22:29:56',NULL),(391,'admin သည် vno: 20250929-223017 ဖြင့် sale return အရောင်းသွင်းသွားသည်။',1,'2025-09-29 22:30:17',NULL),(392,'admin Login ဝင်သွားသည်',1,'2025-09-30 09:17:52',NULL),(393,'adminLogout လုပ်သွားသည်',1,'2025-09-30 09:18:35',NULL),(394,'admin Login ဝင်သွားသည်',1,'2025-09-30 09:24:07',NULL),(395,'adminLogout လုပ်သွားသည်',1,'2025-09-30 09:28:34',NULL),(396,'admin Login ဝင်သွားသည်',1,'2025-09-30 09:28:58',NULL),(397,'admin Login ဝင်သွားသည်',1,'2025-09-30 14:14:58',NULL),(398,'admin Login ဝင်သွားသည်',1,'2025-10-01 21:38:25',NULL),(399,'admin Login ဝင်သွားသည်',1,'2025-10-02 14:44:24',NULL),(400,'admin Login ဝင်သွားသည်',1,'2025-10-02 15:06:42',NULL),(401,'adminသည် Preorderအသစ်တင်သွားသည်',1,'2025-10-02 15:09:39',NULL),(402,'adminသည် Preorderအသစ်တင်သွားသည်',1,'2025-10-02 15:17:40',NULL),(403,'admin Login ဝင်သွားသည်',1,'2025-10-04 15:44:24',NULL),(404,'admin Login ဝင်သွားသည်',1,'2025-10-04 15:59:19',NULL),(405,'admin Login ဝင်သွားသည်',1,'2025-10-04 16:04:09',NULL),(406,'admin Login ဝင်သွားသည်',1,'2025-10-04 16:18:00',NULL),(407,'admin Login ဝင်သွားသည်',1,'2025-10-05 18:01:17',NULL),(408,'adminသည် Preorderအသစ်တင်သွားသည်',1,'2025-10-05 18:10:22',NULL),(409,'adminသည် Preorderအသစ်တင်သွားသည်',1,'2025-10-05 18:14:21',NULL),(410,'adminသည် Preorderအသစ်တင်သွားသည်',1,'2025-10-05 18:20:22',NULL),(411,'adminသည် Preorderအသစ်တင်သွားသည်',1,'2025-10-05 18:21:27',NULL),(412,'admin Login ဝင်သွားသည်',1,'2025-10-05 22:38:39',NULL),(413,'admin Login ဝင်သွားသည်',1,'2025-10-06 22:02:49',NULL),(414,'admin Login ဝင်သွားသည်',1,'2025-10-07 20:09:11',NULL),(415,'adminLogout လုပ်သွားသည်',1,'2025-10-07 20:34:46',NULL),(416,'admin Login ဝင်သွားသည်',1,'2025-10-07 20:35:00',NULL),(417,'admin Login ဝင်သွားသည်',1,'2025-10-07 22:14:59',NULL),(418,'adminLogout လုပ်သွားသည်',1,'2025-10-07 22:15:29',NULL),(419,'admin Login ဝင်သွားသည်',1,'2025-10-07 22:15:30',NULL),(420,'adminLogout လုပ်သွားသည်',1,'2025-10-07 22:25:43',NULL),(421,'user Login ဝင်သွားသည်',4,'2025-10-07 22:25:48',NULL),(422,'userLogout လုပ်သွားသည်',4,'2025-10-07 22:29:09',NULL),(423,'admin Login ဝင်သွားသည်',1,'2025-10-07 22:29:10',NULL),(424,'User \"admin\" logged in',1,'2025-12-04 23:12:57',NULL),(425,'User \"admin\" changed password',1,'2025-12-04 23:13:36',NULL),(426,'User \"admin\" logged in',1,'2025-12-04 23:13:54',NULL),(427,'User \"user\" logged in',5,'2025-12-04 23:15:54',NULL),(428,'User \"admin\" logged in',1,'2025-12-04 23:21:48','::1'),(429,'User \"admin\" logged in',1,'2025-12-04 17:17:21','::1'),(430,'User \"admin\" logged in',1,'2025-12-04 17:19:14','::1'),(431,'User \"admin\" logged in',1,'2025-12-04 17:23:12','::1'),(432,'User \"admin\" logged in',1,'2025-12-05 02:45:48','::1'),(433,'User \"user\" logged in',5,'2025-12-05 02:47:08','::1'),(434,'User \"admin\" logged in',1,'2025-12-05 02:50:22','::1'),(435,'User \"admin\" logged in',1,'2025-12-05 02:54:04','::1'),(436,'User \"admin\" logged in',1,'2025-12-05 02:56:54','::1'),(437,'User \"admin\" logged in',1,'2025-12-05 02:59:55','::1'),(438,'User \"admin\" logged in',1,'2025-12-05 04:25:49','::1'),(439,'User \"admin\" logged in',1,'2025-12-05 04:26:05','::1'),(440,'User \"admin\" logged in',1,'2025-12-05 04:26:14','::1'),(441,'User \"admin\" logged in',1,'2025-12-05 04:37:34','::1'),(442,'User \"admin\" logged in',1,'2025-12-05 06:26:50','::1'),(443,'User \"admin\" logged in',1,'2025-12-05 08:23:56','::1'),(444,'User \"admin\" logged in',1,'2025-12-05 13:40:52','::1'),(445,'User \"admin\" logged in',1,'2025-12-05 13:41:52','::1'),(446,'User \"admin\" logged in',1,'2025-12-05 13:42:04','::1'),(447,'User \"admin\" logged in',1,'2025-12-05 13:42:08','::1'),(448,'User \"admin\" logged in',1,'2025-12-05 14:31:24','::1'),(449,'User \"admin\" logged in',1,'2025-12-05 16:36:02','::1'),(450,'User \"admin\" logged in',1,'2025-12-05 16:54:56','::1'),(451,'User \"admin\" logged in',1,'2025-12-06 11:41:33','::1'),(452,'User \"admin\" logged in',1,'2025-12-06 14:58:59','::1'),(453,'User \"admin\" logged in',1,'2025-12-06 15:02:42','::1'),(454,'User \"admin\" logged in',1,'2025-12-07 03:27:44','::1'),(455,'User \"admin\" logged in',1,'2025-12-07 05:22:23','::1'),(456,'User \"admin\" logged in',1,'2025-12-07 05:22:37','::1'),(457,'User \"admin\" logged in',1,'2025-12-07 05:23:15','::1'),(458,'User \"admin\" logged in',1,'2025-12-07 06:00:37','::1'),(459,'User \"admin\" logged in',1,'2025-12-07 06:35:50','::1'),(460,'User \"admin\" logged in',1,'2025-12-07 06:48:53','::1'),(461,'User \"admin\" logged in',1,'2025-12-08 02:53:24','::1'),(462,'User \"user\" logged in',5,'2025-12-08 06:58:53','::1'),(463,'User \"admin\" logged in',1,'2025-12-08 07:00:00','::1'),(464,'User \"admin\" logged in',1,'2025-12-08 07:33:55','::1'),(465,'User \"admin\" logged in',1,'2025-12-08 08:30:14','::1'),(466,'User \"admin\" logged in',1,'2025-12-08 08:56:50','::1'),(467,'User \"admin\" logged in',1,'2025-12-08 09:04:41','::1'),(468,'User \"admin\" logged in',1,'2025-12-08 09:05:16','::1'),(469,'User \"admin\" logged out',1,'2025-12-08 09:05:51','::1'),(470,'User \"admin\" logged in',1,'2025-12-08 09:05:52','::1'),(471,'POS checkout VNO VN202512080335 (Cash) - Total 165000',1,'2025-12-08 09:08:27','::1'),(472,'Deleted sale VNO VN202512080335 by Unknown',NULL,'2025-12-08 09:22:19','::1'),(473,'Deleted sale VNO VN202512080105 by Unknown',NULL,'2025-12-08 09:22:38','::1'),(474,'Deleted sale VNO VN202512080063 by Unknown',NULL,'2025-12-08 09:25:14','::1'),(475,'User \"admin\" logged out',1,'2025-12-08 09:25:39','::1'),(476,'User \"admin\" logged in',1,'2025-12-08 09:25:40','::1'),(477,'Deleted return sale VNO VN202512080049 by Unknown',NULL,'2025-12-08 09:26:09','::1'),(478,'Deleted sale VNO VN202512080321 by admin',1,'2025-12-08 09:27:47','::1'),(479,'POS checkout VNO VN202512080381 (Credit) - Total 220000',1,'2025-12-08 09:29:14','::1'),(480,'User \"admin\" logged out',1,'2025-12-08 09:44:04','::1'),(481,'User \"admin\" logged in',1,'2025-12-08 09:44:09','::1'),(482,'User \"admin\" logged in',1,'2025-12-15 14:13:58','::1'),(483,'POS checkout VNO VN202512150019 (Cash) - Total 1205000',1,'2025-12-15 14:26:41','::1'),(484,'User \"admin\" logged out',1,'2025-12-15 14:27:44','::1'),(485,'User \"admin\" logged in',1,'2025-12-15 14:57:51','::1'),(486,'User \"admin\" logged in',1,'2025-12-15 14:58:35','::1'),(487,'User \"admin\" logged out',1,'2025-12-15 15:02:11','::1'),(488,'User \"admin\" logged in',1,'2025-12-15 15:02:13','::1'),(489,'User \"admin\" logged in',1,'2025-12-15 15:21:14','::1'),(490,'User \"admin\" logged in',1,'2025-12-15 15:22:44','::1'),(491,'User \"admin\" logged out',1,'2025-12-15 15:24:46','::1'),(492,'User \"admin\" logged in',1,'2025-12-15 15:24:47','::1'),(493,'User \"admin\" logged out',1,'2025-12-15 15:30:39','::1'),(494,'User \"admin\" logged in',1,'2025-12-15 15:30:41','::1'),(495,'User \"admin\" logged in',1,'2025-12-15 15:34:40','::1'),(496,'User \"admin\" logged in',1,'2025-12-15 15:43:52','::1'),(497,'User \"admin\" logged out',1,'2025-12-15 16:18:42','::1'),(498,'User \"admin\" logged in',1,'2025-12-15 16:19:56','::1'),(499,'User \"admin\" logged out',1,'2025-12-15 16:20:44','::1'),(500,'User \"admin\" logged in',1,'2025-12-15 16:23:31','::ffff:72.62.65.15'),(501,'User \"admin\" logged in',1,'2025-12-15 16:25:45','::ffff:72.62.65.15'),(502,'User \"admin\" logged in',1,'2025-12-15 16:34:13','::ffff:72.62.65.15'),(503,'User \"admin\" logged in',1,'2025-12-15 16:34:16','::ffff:72.62.65.15'),(504,'User \"admin\" logged in',1,'2025-12-16 03:12:52','2a02:4780:5e:1671::1'),(505,'User \"admin\" logged in',1,'2025-12-16 13:53:48','::1'),(506,'User \"admin\" logged in',1,'2025-12-16 14:00:29','::1'),(507,'User \"admin\" logged in',1,'2025-12-21 13:53:41','::1'),(508,'POS checkout VNO VN202512210011 (Cash) - Total 220000',1,'2025-12-21 14:44:40','::1'),(509,'POS checkout VNO VN202512210012 (Cash) - Total 220000',1,'2025-12-21 14:45:23','::1'),(510,'POS checkout VNO VN202512210013 (Cash) - Total 220000',1,'2025-12-21 14:45:44','::1'),(511,'POS checkout VNO VN202512210014 (Cash) - Total 165000',1,'2025-12-21 14:47:04','::1'),(512,'User \"admin\" logged out',1,'2025-12-21 14:48:11','::1'),(513,'User \"admin\" logged in',1,'2025-12-21 14:52:05','::1'),(514,'User \"admin\" logged out',1,'2025-12-21 14:52:15','::1'),(515,'User \"admin\" logged in',1,'2025-12-21 14:54:15','::1'),(516,'User \"admin\" logged in',1,'2025-12-25 13:21:25','203.81.91.97'),(517,'User \"admin\" logged out',1,'2025-12-25 13:23:11','203.81.91.97'),(518,'User \"admin\" logged in',1,'2025-12-25 13:23:14','203.81.91.97'),(519,'User \"admin\" logged in',1,'2025-12-26 04:11:55','::ffff:103.83.189.81'),(520,'User \"admin\" logged in',1,'2025-12-26 04:24:06','::ffff:103.83.189.81'),(521,'User \"admin\" logged in',1,'2025-12-26 14:33:31','103.83.189.81'),(522,'User \"admin\" logged out',1,'2025-12-26 14:43:37','103.83.189.81'),(523,'User \"admin\" logged in',1,'2025-12-27 08:48:35','103.83.189.81'),(524,'User \"admin\" logged in',1,'2025-12-27 08:48:45','103.83.189.81'),(525,'User \"admin\" logged out',1,'2025-12-27 08:49:51','103.83.189.81'),(526,'User \"admin\" logged out',1,'2025-12-27 08:49:52','103.83.189.81'),(527,'User \"admin\" logged in',1,'2025-12-29 04:13:38','72.62.65.15'),(528,'User \"admin\" logged in',1,'2025-12-29 08:35:34','72.62.65.15'),(529,'User \"admin\" logged in',1,'2025-12-29 08:54:12','72.62.65.15'),(530,'User \"admin\" logged in',1,'2025-12-29 12:16:22','120.88.32.167'),(531,'User \"admin\" logged out',1,'2025-12-29 12:19:11','120.88.32.167'),(532,'User \"admin\" logged out',1,'2025-12-30 22:10:50','::1'),(533,'User \"admin\" logged in',1,'2025-12-30 22:12:40','::1'),(534,'POS checkout VNO VN202512300025 (KPay) - Total 220000',1,'2025-12-30 22:12:54','::1'),(535,'POS checkout VNO VN202512300033 (Cash) - Total 1659895',1,'2025-12-30 22:19:09','::1'),(536,'Credit payment for VNO VN202512080381 amount 2000 by admin',1,'2025-12-30 22:35:38','::1'),(537,'Credit payment for VNO VN202512080381 amount 200000 by admin',1,'2025-12-30 22:36:06','::1'),(538,'Credit payment for VNO VN202512080381 amount 18000 by admin',1,'2025-12-30 22:44:21','::1'),(539,'Deleted credit payment ID 5 for VNO VN202512080381 by Unknown',NULL,'2025-12-30 22:47:05','::1'),(540,'Processed return VNO VN202512300033 - refund 889000',1,'2025-12-30 22:50:47','::1'),(541,'Deleted return sale VNO VN202512300033 by admin',1,'2025-12-30 22:56:29','::1'),(542,'Processed return VNO VN202512300033 - refund 889000',1,'2025-12-30 22:56:40','::1'),(543,'Deleted return sale VNO VN202512300033 by admin',1,'2025-12-30 22:56:53','::1'),(544,'Processed return VNO VN202512300033 - refund 889000',1,'2025-12-30 22:59:12','::1'),(545,'POS checkout VNO VN202512300133 (Cash) - Total 165000',1,'2025-12-30 23:35:43','::1'),(546,'POS checkout VNO VN202512300137 (Cash) - Total 889000',1,'2025-12-31 00:17:46','::1'),(547,'User \"admin\" logged out',1,'2025-12-31 00:23:28','::1'),(548,'User \"admin\" logged in',1,'2025-12-31 00:23:43','::1'),(549,'User \"admin\" logged out',1,'2025-12-31 00:24:07','::1'),(550,'User \"admin\" logged in',1,'2025-12-31 00:24:22','::1'),(551,'User \"admin\" logged out',1,'2025-12-31 00:37:33','::1'),(552,'User \"admin\" logged in',1,'2025-12-31 00:37:38','::1'),(553,'User \"admin\" logged out',1,'2025-12-31 00:37:43','::1'),(554,'User \"admin\" logged in',1,'2025-12-31 00:40:13','::1'),(555,'User \"admin\" logged in',1,'2025-12-31 00:44:03','::1'),(556,'User \"admin\" logged in',1,'2025-12-31 03:55:53','66.42.51.11'),(557,'POS checkout VNO VN202512300001 (KPay) - Total 55000',1,'2025-12-31 03:56:31','66.42.51.11'),(558,'User \"admin\" logged in',1,'2025-12-31 04:25:05','66.42.51.11'),(559,'User \"admin\" logged out',1,'2025-12-31 04:25:44','66.42.51.11'),(560,'User \"admin\" logged in',1,'2025-12-31 04:26:24','66.42.51.11'),(561,'User \"admin\" logged in',1,'2025-12-31 04:28:40','66.42.51.11'),(562,'User \"admin\" logged in',1,'2025-12-31 04:31:39','::1'),(563,'User \"admin\" logged in',1,'2026-01-04 07:45:32','::1'),(564,'User \"admin\" logged out',1,'2026-01-04 07:46:51','::1'),(565,'User \"admin\" logged in',1,'2026-01-04 07:58:54','::1'),(566,'User \"admin\" logged in',1,'2026-01-05 04:00:56','120.88.34.226'),(567,'User \"admin\" logged in',1,'2026-01-05 06:07:08','72.62.65.15'),(568,'POS checkout VNO VN202601040005 (WavePay) - Total 2080000',1,'2026-01-05 06:08:12','72.62.65.15'),(569,'User \"admin\" logged in',1,'2026-01-05 11:25:50','103.83.189.197'),(570,'User \"admin\" logged out',1,'2026-01-05 11:27:08','103.83.189.197'),(571,'User \"admin\" logged in',1,'2026-01-05 16:33:19','72.62.65.15'),(572,'POS checkout VNO VN202601050003 (Cash) - Total 1370000',1,'2026-01-05 17:08:20','72.62.65.15'),(573,'Processed return VNO VN202601050003 - refund 165000',1,'2026-01-05 17:11:43','72.62.65.15'),(574,'User \"admin\" logged out',1,'2026-01-05 17:16:40','72.62.65.15'),(575,'User \"staff1\" logged in',6,'2026-01-05 17:16:44','72.62.65.15'),(576,'User \"staff1\" logged out',6,'2026-01-05 17:17:05','72.62.65.15'),(577,'User \"admin\" logged in',1,'2026-01-05 17:17:08','72.62.65.15'),(578,'User \"admin\" logged out',1,'2026-01-05 17:21:32','72.62.65.15'),(579,'User \"admin\" logged in',1,'2026-01-06 06:30:21','72.62.65.15'),(580,'User \"admin\" logged out',1,'2026-01-06 06:39:15','203.81.91.11'),(581,'User \"admin\" logged in',1,'2026-01-06 06:41:43','120.88.34.226'),(582,'User \"admin\" logged in',1,'2026-01-06 06:43:41','203.81.91.11'),(583,'User \"admin\" logged out',1,'2026-01-06 06:45:23','120.88.34.226'),(584,'User \"staff1\" logged in',6,'2026-01-06 06:45:28','120.88.34.226'),(585,'User \"staff1\" logged out',6,'2026-01-06 06:45:53','120.88.34.226'),(586,'User \"admin\" logged in',1,'2026-01-06 06:45:58','120.88.34.226'),(587,'User \"admin\" logged in',1,'2026-01-06 06:48:31','::1'),(588,'User \"admin\" logged in',1,'2026-01-06 06:53:24','::1'),(589,'POS checkout VNO VN202601060007 (Credit) - Total 330000',1,'2026-01-06 07:18:53','::1'),(590,'User \"admin\" logged out',1,'2026-01-06 07:19:51','::1'),(591,'User \"user\" logged in',5,'2026-01-06 07:19:57','::1'),(592,'User \"user\" logged out',5,'2026-01-06 07:20:06','::1'),(593,'User \"admin\" logged in',1,'2026-01-06 07:25:22','::1'),(594,'User \"admin\" logged out',1,'2026-01-06 07:26:04','::1'),(595,'POS checkout VNO VN202601060025 (Cash) - Total 1650000',1,'2026-01-06 07:26:43','120.88.34.226'),(596,'POS checkout VNO VN202601060026 (Credit) - Total 1205000',1,'2026-01-06 07:27:48','120.88.34.226'),(597,'Credit payment for VNO VN202601060026 amount 1205000 by admin',1,'2026-01-06 07:31:47','120.88.34.226'),(598,'User \"admin\" logged in',1,'2026-01-06 07:33:13','::1'),(599,'Processed return VNO VN202601060025 - refund 825000',1,'2026-01-06 07:34:32','120.88.34.226'),(600,'User \"admin\" logged out',1,'2026-01-06 07:43:45','72.62.65.15'),(601,'User \"userone\" logged in',7,'2026-01-06 07:43:49','72.62.65.15'),(602,'User \"userone\" logged out',7,'2026-01-06 07:44:27','72.62.65.15'),(603,'User \"admin\" logged in',1,'2026-01-06 07:44:30','72.62.65.15'),(604,'User \"admin\" logged in',1,'2026-01-06 12:51:08','103.83.189.227'),(605,'User \"admin\" logged out',1,'2026-01-06 13:01:31','72.62.65.15'),(606,'User \"admin\" logged in',1,'2026-01-06 13:21:23','72.62.65.15'),(607,'POS checkout VNO VN202601060001 (KPay) - Total 1370000',1,'2026-01-06 13:26:30','72.62.65.15'),(608,'Credit payment for VNO VN202601060007 amount 30000 by admin',1,'2026-01-06 13:29:04','72.62.65.15'),(609,'Credit payment for VNO VN202601060007 amount 300000 by admin',1,'2026-01-06 13:29:19','72.62.65.15'),(610,'Processed return VNO VN202601060001 - refund 165000',1,'2026-01-06 13:31:11','72.62.65.15'),(611,'User \"admin\" logged out',1,'2026-01-06 13:39:42','72.62.65.15'),(612,'User \"staff\" logged in',8,'2026-01-06 13:39:53','72.62.65.15'),(613,'User \"staff\" logged out',8,'2026-01-06 13:40:22','72.62.65.15'),(614,'User \"admin\" logged in',1,'2026-01-06 13:40:30','72.62.65.15'),(615,'POS checkout VNO VN202601060017 (Cash) - Total 220000',1,'2026-01-06 13:42:38','72.62.65.15'),(616,'POS checkout VNO VN202601060019 (Cash) - Total 8000',1,'2026-01-06 13:49:10','72.62.65.15'),(617,'Deleted sale VNO VN202601060019 by admin',1,'2026-01-06 13:49:34','72.62.65.15'),(618,'POS checkout VNO VN202601060024 (Cash) - Total 2100000',1,'2026-01-06 13:55:14','103.83.189.227'),(619,'User \"admin\" logged out',1,'2026-01-06 14:05:26','72.62.65.15'),(620,'User \"admin\" logged in',1,'2026-01-07 01:13:23','37.111.41.125'),(621,'User \"admin\" logged in',1,'2026-01-07 02:56:33','202.191.104.253'),(622,'User \"admin\" logged in',1,'2026-01-07 05:26:24','202.191.104.253'),(623,'User \"admin\" logged in',1,'2026-01-07 05:32:25','37.111.41.125'),(624,'User \"admin\" logged in',1,'2026-01-07 09:44:28','37.111.41.125'),(625,'User \"admin\" logged in',1,'2026-01-08 05:13:16','72.62.65.15'),(626,'User \"admin\" logged in',1,'2026-01-09 04:03:21','136.228.175.207'),(627,'User \"admin\" logged in',1,'2026-01-09 05:30:21','::1'),(628,'User \"admin\" logged in',1,'2026-01-09 05:34:45','::1'),(629,'User \"admin\" logged in',1,'2026-01-09 05:42:11','::1'),(630,'User \"admin\" logged in',1,'2026-01-09 05:47:10','::1'),(631,'User \"admin\" logged in',1,'2026-01-09 06:00:27','136.228.175.207'),(632,'POS checkout VNO VN202601090003 (Cash) - Total 220000',1,'2026-01-09 07:01:00','136.228.175.207'),(633,'POS checkout VNO VN202601090005 (Cash) - Total 2080000',1,'2026-01-09 07:09:47','136.228.175.207'),(634,'POS checkout VNO VN202601090006 (Cash) - Total 1895000',1,'2026-01-09 07:11:22','136.228.175.207'),(635,'User \"admin\" logged in',1,'2026-01-09 07:24:01','5.104.83.47'),(636,'POS checkout VNO VN202601090014 (KPay) - Total 1939000',1,'2026-01-09 07:48:55','175.41.197.208'),(637,'User \"admin\" logged in',1,'2026-01-09 12:42:19','72.62.65.15'),(638,'User \"admin\" logged in',1,'2026-01-10 06:06:34','136.228.175.91'),(639,'User \"admin\" logged in',1,'2026-01-10 09:26:15','45.41.106.244'),(640,'User \"admin\" logged in',1,'2026-01-10 09:26:20','45.41.106.229'),(641,'User \"admin\" logged in',1,'2026-01-10 10:46:01','5.104.83.47'),(642,'User \"admin\" logged in',1,'2026-01-10 10:46:17','::1'),(643,'User \"admin\" logged in',1,'2026-01-10 10:51:25','::1'),(644,'User \"admin\" logged in',1,'2026-01-10 16:36:14','5.104.83.47'),(645,'User \"admin\" logged in',1,'2026-01-11 07:35:30','202.165.89.102'),(646,'Processed return VNO VN202601090014 - refund 1050000',1,'2026-01-11 10:09:20','45.41.106.229'),(647,'POS checkout VNO VN202601110009 (Credit) - Total 4100',1,'2026-01-11 10:10:46','45.41.106.229'),(648,'Credit payment for VNO VN202601110009 amount 2000 by admin',1,'2026-01-11 10:11:15','202.165.88.113'),(649,'Credit payment for VNO VN202601110009 amount 2000 by admin',1,'2026-01-11 10:11:52','45.41.106.229'),(650,'User \"admin\" logged in',1,'2026-01-11 14:40:30','72.62.65.15'),(651,'User \"admin\" logged out',1,'2026-01-11 14:41:19','72.62.65.15'),(652,'User \"admin\" logged in',1,'2026-01-12 09:42:36','::1'),(653,'User \"admin\" logged in',1,'2026-01-12 09:51:33','::1'),(654,'User \"admin\" logged in',1,'2026-01-12 14:58:51','72.62.65.15'),(655,'User \"admin\" logged in',1,'2026-01-13 04:27:55','37.111.15.4'),(656,'User \"admin\" logged in',1,'2026-01-13 09:12:20','37.111.13.31'),(657,'User \"admin\" logged in',1,'2026-01-13 09:15:35','37.111.13.160'),(658,'User \"admin\" logged in',1,'2026-01-13 09:34:21','72.62.65.15'),(659,'User \"admin\" logged in',1,'2026-01-14 12:41:17','37.111.6.243'),(660,'User \"admin\" logged in',1,'2026-01-14 12:52:18','103.233.207.50'),(661,'User \"admin\" logged in',1,'2026-01-15 02:20:55','37.111.15.193'),(662,'User \"admin\" logged in',1,'2026-01-15 07:14:45','72.62.65.15'),(663,'User \"admin\" logged in',1,'2026-01-15 07:27:36','136.228.175.182'),(664,'User \"admin\" logged in',1,'2026-01-15 07:53:48','136.228.175.54'),(665,'User \"admin\" logged in',1,'2026-01-16 07:51:40','72.62.65.15'),(666,'User \"admin\" logged out',1,'2026-01-16 07:53:54','72.62.65.15'),(667,'User \"admin\" logged in',1,'2026-01-20 11:55:46','45.41.106.8'),(668,'User \"admin\" logged in',1,'2026-01-22 09:46:32','76.13.22.31'),(669,'User \"admin\" logged in',1,'2026-01-22 15:26:00','103.83.189.149'),(670,'User \"admin\" logged in',1,'2026-01-23 03:34:40','203.81.91.15'),(671,'User \"admin\" logged in',1,'2026-01-23 03:48:32','203.81.91.15'),(672,'User \"admin\" logged in',1,'2026-01-23 08:25:50','45.41.106.8'),(673,'User \"admin\" logged in',1,'2026-01-23 08:51:13','76.13.22.31'),(674,'User \"admin\" logged in',1,'2026-01-23 10:47:14','136.228.175.137');
/*!40000 ALTER TABLE `tbllog` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tblpurchase`
--

DROP TABLE IF EXISTS `tblpurchase`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tblpurchase` (
  `AID` int(11) NOT NULL AUTO_INCREMENT,
  `CodeNo` varchar(45) DEFAULT NULL,
  `ItemName` varchar(200) DEFAULT NULL,
  `Qty` int(11) DEFAULT NULL,
  `PurchasePrice` float DEFAULT NULL,
  `SellPrice` float DEFAULT NULL,
  `CategoryID` int(11) DEFAULT NULL,
  `SupplierID` int(11) DEFAULT NULL,
  `Date` date DEFAULT NULL,
  `Img` varchar(100) DEFAULT NULL,
  `VNO` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`AID`)
) ENGINE=InnoDB AUTO_INCREMENT=256 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tblpurchase`
--

LOCK TABLES `tblpurchase` WRITE;
/*!40000 ALTER TABLE `tblpurchase` DISABLE KEYS */;
INSERT INTO `tblpurchase` VALUES (1,'PUR-11761245','nc',100,200,300,51,1,'2025-12-08',NULL,'PUR202512080001'),(2,'BA-280902','Boniaအနက်ကွပ်ညိုလေး',100,730000,950000,32,1,'2025-12-08',NULL,'PUR202512080001'),(3,'BA-280901','Boniaညို့နှစ်ရောင်စပ်',100,795000,895000,32,1,'2025-12-08',NULL,'PUR202512080001'),(4,'FF-260902','Fitflop အမြင့် အဖြူ',100,268000,388000,33,1,'2025-12-08',NULL,'PUR202512080001'),(5,'MK-260902','MK ရေပုံးလေးထောင့်',100,570000,675000,32,1,'2025-12-08',NULL,'PUR202512080001'),(6,'MK-260901','MK ရေပုံးလေးထောင့်',100,570000,675000,32,1,'2025-12-08',NULL,'PUR202512080001'),(7,'MK-190902','MK Belt ညို',100,350000,450000,34,1,'2025-12-08',NULL,'PUR202512080001'),(8,'MK-190901','MK Wallet New (Black) (Sliver)',100,350000,450000,32,1,'2025-12-08',NULL,'PUR202512080001'),(9,'FF-190901','Fitflop (ကျောက်ပါအပါး)(38)',100,260000,315000,33,1,'2025-12-08',NULL,'PUR202512080001'),(10,'GL-190901','Guy Laroche Wallet Blue',100,275000,295000,32,1,'2025-12-08',NULL,'PUR202512080001'),(11,'BA-190909','Bonia Black ကွင်းပါ',100,796000,985000,32,1,'2025-12-08',NULL,'PUR202512080001'),(12,'CQ-190901','Clinique Happy (heart)',100,99000,125000,47,1,'2025-12-08',NULL,'PUR202512080001'),(13,'BA-190908','Bonia wallet New',100,395000,445000,32,1,'2025-12-08',NULL,'PUR202512080001'),(14,'BA-190907','Bonia စိမ်းညို့ရောင်ကွပ်',100,890000,995000,32,1,'2025-12-08',NULL,'PUR202512080001'),(15,'BA-190906','Bonia မြင်းချေးရောင်',100,895000,995000,32,1,'2025-12-08',NULL,'PUR202512080001'),(16,'BA-190905','Bonia လခြမ်း',100,880000,995000,32,1,'2025-12-08',NULL,'PUR202512080001'),(17,'BA-190904','Bonia လဝိုင်း အညို',100,795000,855000,32,1,'2025-12-08',NULL,'PUR202512080001'),(18,'BA-190903','Bonia အနက်လုံး',100,850000,995000,32,1,'2025-12-08',NULL,'PUR202512080001'),(19,'BA-190902','Bonia အနက် hand back ရွှေရောင်းကြိုး',100,995000,1095000,32,1,'2025-12-08',NULL,'PUR202512080001'),(20,'BA-190901','Bonia ညို ဖြူကွပ်',100,600000,700000,32,1,'2025-12-08',NULL,'PUR202512080001'),(21,'VS-190901','Versace belt',100,1790000,1885000,34,1,'2025-12-08',NULL,'PUR202512080001'),(22,'BA-160905','Bonia Handbag သေး',100,778000,950000,32,1,'2025-12-08',NULL,'PUR202512080001'),(23,'BA-160904','Bonia Handbag စာသားပါ (Black) (Cream)',100,1050000,1155000,32,1,'2025-12-08',NULL,'PUR202512080001'),(24,'BA-160903','Bonia Handbag လက်ချိတ်',100,835000,945000,32,1,'2025-12-08',NULL,'PUR202512080001'),(25,'BA-160902','Bonia Handbag',100,750000,925000,32,1,'2025-12-08',NULL,'PUR202512080001'),(26,'BA-160901','Bonia Wallet',100,286000,328000,32,1,'2025-12-08',NULL,'PUR202512080001'),(27,'CH-110902','Coach Black',100,945000,1045000,32,1,'2025-12-08',NULL,'PUR202512080001'),(28,'MK-120902','MK Brown Belt',100,385000,415000,34,1,'2025-12-08',NULL,'PUR202512080001'),(29,'MK-120901','MK Brown အနက် ကွပ်',100,589000,625000,32,1,'2025-12-08',NULL,'PUR202512080001'),(30,'VS-110901','Versace Belt ရွှေ',100,1450000,1550000,34,1,'2025-12-08',NULL,'PUR202512080001'),(31,'CH-110901','Coach handbag ပန်း ကွပ်',100,496500,598000,32,1,'2025-12-08',NULL,'PUR202512080001'),(32,'YSL-110902','YSL Perfume For Men',100,565000,665000,47,1,'2025-12-08',NULL,'PUR202512080001'),(33,'BW-110902','Bonia Couple Watch (မ)',100,507000,657000,50,1,'2025-12-08',NULL,'PUR202512080001'),(34,'BW-110901','Bonia Couple Watch (ကျား)',100,507000,667000,50,1,'2025-12-08',NULL,'PUR202512080001'),(35,'Di-110902','Dior Set',100,605000,693500,40,1,'2025-12-08',NULL,'PUR202512080001'),(36,'Di-110901','Dior Lip Glow',100,195000,215000,39,1,'2025-12-08',NULL,'PUR202512080001'),(37,'SK-110901','SKII Mini Set',100,236000,258000,40,1,'2025-12-08',NULL,'PUR202512080001'),(38,'MK-110904','MK Wallet (White) (Brown) (Black)',100,310000,388000,32,1,'2025-12-08',NULL,'PUR202512080001'),(39,'MK-110903','MK Black ရွှေကြိုး',100,570000,645000,32,1,'2025-12-08',NULL,'PUR202512080001'),(40,'MK-110902','MK White ပန်းကွတ်',100,490000,585000,32,1,'2025-12-08',NULL,'PUR202512080001'),(41,'MK-110901','MK ကြီး နက်',100,610000,685000,32,1,'2025-12-08',NULL,'PUR202512080001'),(42,'PDP-110901','Prada Candy Perfume',100,465000,525000,47,1,'2025-12-08',NULL,'PUR202512080001'),(43,'FB-110901','Flower Bomb Perfume',100,415000,485000,47,1,'2025-12-08',NULL,'PUR202512080001'),(44,'YSL-110901','YSL Mon Paris Perfume',100,585000,685000,47,1,'2025-12-08',NULL,'PUR202512080001'),(45,'EL-110901','Estee Lauder Perfume',100,345000,398000,47,1,'2025-12-08',NULL,'PUR202512080001'),(46,'TB-020911','Tory Burch  နက်',100,1200000,1250000,32,1,'2025-12-08',NULL,'PUR202512080001'),(47,'BT-020901','Bata Shoe (စိမ်းဖျော့)',100,45000,55000,33,1,'2025-12-08',NULL,'PUR202512080001'),(48,'VNC-020902','VNC Sandal (Gray) (5)',100,35000,35000,33,1,'2025-12-08',NULL,'PUR202512080001'),(49,'ZR-020901','ZARA နက် (39)',100,83000,93000,33,1,'2025-12-08',NULL,'PUR202512080001'),(182,'VNC-020901123','VNC Sandal (Black/8) (Pink/7)',200,78000,88000,33,2,'2025-12-30','/assets/purchase/purchase_1765808198808_322748849.jpg','PUR202512080002'),(183,'TB-0209011234','Tory Burch Shoe Black (9)',200,550000,650000,33,2,'2025-12-30',NULL,'PUR202512080002'),(184,'PD-020901','PRADA ဒေါက်မြင့် နက် China (39)',200,49000,55000,33,2,'2025-12-30',NULL,'PUR202512080002'),(185,'BB-020901','Burberry Sandal (Black/40) (Cream/39)',200,39500,49500,33,2,'2025-12-30',NULL,'PUR202512080002'),(186,'BA-020920','Bonia Sandal (39) (စာသားပါ)',200,400000,465000,33,2,'2025-12-30',NULL,'PUR202512080002'),(187,'BA-020919','Bonia Sandal (39)',200,400000,465000,33,2,'2025-12-30',NULL,'PUR202512080002'),(188,'BA-020918','Bonia Shoe (အပါး) (39)',200,400000,465000,33,2,'2025-12-30',NULL,'PUR202512080002'),(189,'BA-020917','Bonia Shoe (ထိပ်ချွန်) နက်ပြောင် (38)',200,435000,485000,33,2,'2025-12-30',NULL,'PUR202512080002'),(190,'BA-020916','Bonia Shoe (အပါး) (36)',200,400000,465000,33,2,'2025-12-30',NULL,'PUR202512080002'),(191,'BA-020915','Bonia Shoe (ထိပ်လုံး) brown (40)',200,435000,485000,33,2,'2025-12-30',NULL,'PUR202512080002'),(192,'BA-020914','Bonia Shoe (ထိပ်ပြား) နက်ပြောင် (40)',200,435000,485000,33,2,'2025-12-30',NULL,'PUR202512080002'),(193,'BA-020913','Bonia Shoe (Logo) Cream',200,450000,515000,33,2,'2025-12-30',NULL,'PUR202512080002'),(194,'BA-020912','Bonia Shoe (ပုံရိုး) (မြင့်) Black',400,435000,485000,33,2,'2025-12-30',NULL,'PUR202512080002'),(195,'BA-020911','Bonia Shoe (B၂လုံးပါ) (36) (40)',200,435000,485000,33,2,'2025-12-30',NULL,'PUR202512080002'),(196,'FF-020908','Fitflop (ပွင့်ဖတ်ပုံ)  (36)  Pepsi',200,235000,385000,33,2,'2025-12-30',NULL,'PUR202512080002'),(197,'FF-020907','Fitflop (ကျောက်ပါအပါး)  (36) (37) Black',200,260000,315000,33,2,'2025-12-30',NULL,'PUR202512080002'),(198,'FF-020906','Fitflop (ကျောက်ပါအပါး)  (37) Nude',200,260000,315000,33,2,'2025-12-30',NULL,'PUR202512080002'),(199,'FF-020905','Fitflop (စိန်လေးထောင့်ပုံ)  (38) (နက်ပြာ)',200,350000,415000,33,2,'2025-12-30',NULL,'PUR202512080002'),(200,'FF-020904','Fitflop (ပန်း၃ပွင့်ပုံ)  (39) (နက်ပြာ)',200,410000,478000,33,2,'2025-12-30',NULL,'PUR202512080002'),(201,'FF-020903','Fitflop (သစ်ခက်ပုံ)  (36) (နက်)',200,350000,415000,33,2,'2025-12-30',NULL,'PUR202512080002'),(202,'FF-020902','Fitflop (သစ်ခက်ပုံ)  (37) (ခရမ်း)',200,350000,415000,33,2,'2025-12-30',NULL,'PUR202512080002'),(203,'FF-020901','Fitflop Black (36) (38) (41)',200,410000,468000,33,2,'2025-12-30',NULL,'PUR202512080002'),(204,'KPK-010900','Kopiko Coffee',2000,10000,11500,46,2,'2025-12-30',NULL,'PUR202512080002'),(205,'BA-010909','Bonia New (ခြင်းတောင်း) (နက်) (ညို)',200,769000,889000,32,2,'2025-12-30',NULL,'PUR202512080002'),(206,'BA-010908','Bonia New (နီညို/အောက် ၃မြောင့်)',200,630000,785000,32,2,'2025-12-30',NULL,'PUR202512080002'),(207,'BA-010907','Bonia New (နက်/သေး)',200,725000,775000,32,2,'2025-12-30',NULL,'PUR202512080002'),(208,'BA-010906','Bonia New (ရိုးရိုး/နက် ၂လိုင်း)',200,795000,895000,32,2,'2025-12-30',NULL,'PUR202512080002'),(209,'BA-010905','Bonia New (အနက် ကွပ်)',200,900000,955000,32,2,'2025-12-30',NULL,'PUR202512080002'),(210,'BA-010904','Bonia New (ညို/အနက် ၂လိုင်း)',200,700000,788000,32,2,'2025-12-30',NULL,'PUR202512080002'),(211,'BA-010903','Bonia New (အနက် ခြင်းတောင်း)',200,800000,885000,32,2,'2025-12-30',NULL,'PUR202512080002'),(212,'BA-010902','Bonia New (အဖုံး စာသား)',200,850000,950000,32,2,'2025-12-30',NULL,'PUR202512080002'),(213,'BA-010901','Bonia New (ချော့ကလက် ကိုင်း)',200,770000,885000,32,2,'2025-12-30',NULL,'PUR202512080002'),(214,'MD-010901','MossDoom လွယ် အသား',200,70000,95000,32,2,'2025-12-30',NULL,'PUR202512080002'),(215,'GL-010911','Guy Laroche ခါးပတ်',200,105000,185000,34,2,'2025-12-30',NULL,'PUR202512080002'),(216,'AW-010911','Arrow ခါးပတ်',200,105000,165000,34,2,'2025-12-30',NULL,'PUR202512080002'),(217,'DS-010922','DAKS Belt ခေါင်းသေး',200,180000,225000,34,2,'2025-12-30',NULL,'PUR202512080002'),(218,'DS-010911','DAKS Belt ခေါင်းကြီး',200,225000,275000,34,2,'2025-12-30',NULL,'PUR202512080002'),(219,'FF-010905','Fitflop EU-37 (ပါး) ရွှေဖျော့/အသား',200,280000,325000,33,2,'2025-12-30',NULL,'PUR202512080002'),(220,'FF-010904','Fitflop EU-37/38 (နက်/ပါး)',200,280000,325000,33,2,'2025-12-30',NULL,'PUR202512080002'),(221,'UQ-010904','UniQlo Shirt (ကျား) ဖြူ XL',200,47000,65000,48,2,'2025-12-30',NULL,'PUR202512080002'),(222,'GL-010901','Guy Laroche Shirt (ကျား) နက်/ပြာ/ဖြူ M',200,48000,68000,48,2,'2025-12-30',NULL,'PUR202512080002'),(223,'UQ-010903','UniQlo Shirt (မ/ရှည်/ပန်း)',200,119000,149000,49,2,'2025-12-30',NULL,'PUR202512080002'),(224,'UQ-010902','UniQlo Shirt (မ/ရှည်/ပြာဖြူဖောက်) L/M',200,119000,149000,49,2,'2025-12-30',NULL,'PUR202512080002'),(225,'UQ-010901','UniQlo Shirt (မ/ရှည်/ပြာနု) S',200,119000,149000,49,2,'2025-12-30',NULL,'PUR202512080002'),(226,'4164295847495','Facial Form',100,1000,1100,40,2,'2026-01-05',NULL,'PUR202601050001'),(227,'3129989927262','ToothPaste',100,1000,1100,40,1,'2026-01-05',NULL,'PUR202601050002'),(229,'3497761411348','item a',100,2500,3000,40,1,'2026-01-06','/assets/purchase/purchase_1767707068573_194181638.jpg','PUR202601060002'),(230,'4679175921288','item b',100,3000,4000,40,1,'2026-01-06',NULL,'PUR202601060002'),(247,'8850679071795','make up',120,500,600,40,1,'2026-01-14',NULL,'PUR202601060001'),(248,'1001','Apple',15,500,700,NULL,1,'2026-01-14',NULL,'PUR202601070001'),(249,'1002','Orange',20,600,800,NULL,1,'2026-01-14',NULL,'PUR202601070001'),(250,'1003','Notebook',5,1200,1500,NULL,1,'2026-01-14',NULL,'PUR202601070001'),(251,'1001','အဆင်',35,500,700,NULL,2,'2026-01-14',NULL,'PUR202601120001'),(252,'1002','ပြေလား',33,600,800,NULL,2,'2026-01-14',NULL,'PUR202601120001'),(253,'1003','အဆင်',5,1200,1500,NULL,2,'2026-01-14',NULL,'PUR202601120001'),(255,'1541541882026','testing 123 QTY',25,1500,1800,51,1,'2026-01-14',NULL,'PUR202601140001');
/*!40000 ALTER TABLE `tblpurchase` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tblpurchase_return`
--

DROP TABLE IF EXISTS `tblpurchase_return`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tblpurchase_return` (
  `AID` int(11) NOT NULL AUTO_INCREMENT,
  `PurchaseID` int(11) DEFAULT NULL,
  `SupplierID` int(11) DEFAULT NULL,
  `OriginalQty` int(11) DEFAULT 0,
  `Price` double DEFAULT 0,
  `ReturnQty` int(11) DEFAULT 0,
  `Date` date DEFAULT NULL,
  `SubTotal` float DEFAULT NULL,
  `VNO` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`AID`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tblpurchase_return`
--

LOCK TABLES `tblpurchase_return` WRITE;
/*!40000 ALTER TABLE `tblpurchase_return` DISABLE KEYS */;
INSERT INTO `tblpurchase_return` VALUES (6,182,2,200,78000,5,'2025-12-30',390000,'PUR202512080002'),(7,183,2,200,550000,3,'2025-12-30',1650000,'PUR202512080002'),(8,227,1,100,1000,10,'2026-01-05',10000,'PUR202601050002'),(9,228,1,100,500,10,'2026-01-06',5000,'PUR202601060001');
/*!40000 ALTER TABLE `tblpurchase_return` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tblpurchase_return_voucher`
--

DROP TABLE IF EXISTS `tblpurchase_return_voucher`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tblpurchase_return_voucher` (
  `AID` int(11) NOT NULL AUTO_INCREMENT,
  `VNO` varchar(45) DEFAULT NULL,
  `SupplierID` int(11) DEFAULT NULL,
  `OriginalAmount` float DEFAULT NULL,
  `ReturnAmount` float DEFAULT NULL,
  `UserID` int(11) DEFAULT NULL,
  `Reason` varchar(200) DEFAULT NULL,
  `Date` date DEFAULT NULL,
  PRIMARY KEY (`AID`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tblpurchase_return_voucher`
--

LOCK TABLES `tblpurchase_return_voucher` WRITE;
/*!40000 ALTER TABLE `tblpurchase_return_voucher` DISABLE KEYS */;
INSERT INTO `tblpurchase_return_voucher` VALUES (4,'PUR202512080002',2,125600000,2040000,1,'damaged','2025-12-30'),(5,'PUR202601050002',1,100000,10000,1,'damaged','2026-01-05'),(6,'PUR202601060001',1,50000,5000,1,'defective','2026-01-06');
/*!40000 ALTER TABLE `tblpurchase_return_voucher` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tblpurchase_voucher`
--

DROP TABLE IF EXISTS `tblpurchase_voucher`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tblpurchase_voucher` (
  `AID` int(11) NOT NULL AUTO_INCREMENT,
  `VNO` varchar(45) DEFAULT NULL,
  `SupplierID` int(11) DEFAULT NULL,
  `Amount` double DEFAULT NULL,
  `Date` date DEFAULT NULL,
  `UserID` int(11) DEFAULT NULL,
  PRIMARY KEY (`AID`),
  UNIQUE KEY `VNO_UNIQUE` (`VNO`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tblpurchase_voucher`
--

LOCK TABLES `tblpurchase_voucher` WRITE;
/*!40000 ALTER TABLE `tblpurchase_voucher` DISABLE KEYS */;
INSERT INTO `tblpurchase_voucher` VALUES (1,'PUR202512080001',1,2848570000,'2025-12-08',1),(2,'PUR202512080002',2,3347500000,'2025-12-08',1),(3,'PUR202601050001',2,100000,'2026-01-05',1),(4,'PUR202601050002',1,100000,'2026-01-05',1),(5,'PUR202601060001',1,60000,'2026-01-06',1),(6,'PUR202601060002',1,550000,'2026-01-06',1),(7,'PUR202601070001',1,25500,'2026-01-07',1),(10,'PUR202601120001',2,43300,'2026-01-12',1),(11,'PUR202601140001',1,37500,'2026-01-14',1);
/*!40000 ALTER TABLE `tblpurchase_voucher` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tblremain`
--

DROP TABLE IF EXISTS `tblremain`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tblremain` (
  `AID` int(11) NOT NULL AUTO_INCREMENT,
  `CodeNo` varchar(45) DEFAULT NULL,
  `ItemName` varchar(300) DEFAULT NULL,
  `Qty` int(11) DEFAULT 0,
  `PurchasePrice` double DEFAULT 0,
  `SellPrice` double DEFAULT 0,
  `CategoryID` int(11) DEFAULT NULL,
  `SupplierID` int(11) DEFAULT NULL,
  `Img` varchar(100) DEFAULT NULL,
  `Rating` int(11) DEFAULT 0,
  `SellCount` int(11) DEFAULT 0,
  `Date` date DEFAULT NULL,
  PRIMARY KEY (`AID`),
  UNIQUE KEY `CodeNo_UNIQUE` (`CodeNo`)
) ENGINE=InnoDB AUTO_INCREMENT=238 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tblremain`
--

LOCK TABLES `tblremain` WRITE;
/*!40000 ALTER TABLE `tblremain` DISABLE KEYS */;
INSERT INTO `tblremain` VALUES (1,'PUR-11761245','nc',100,200,300,51,1,NULL,0,0,NULL),(2,'BA-280902','Boniaအနက်ကွပ်ညိုလေး',100,730000,950000,32,1,NULL,0,0,NULL),(3,'BA-280901','Boniaညို့နှစ်ရောင်စပ်',100,795000,895000,32,1,NULL,0,0,NULL),(4,'FF-260902','Fitflop အမြင့် အဖြူ',100,268000,388000,33,1,NULL,0,0,NULL),(5,'MK-260902','MK ရေပုံးလေးထောင့်',100,570000,675000,32,1,NULL,0,0,NULL),(6,'MK-260901','MK ရေပုံးလေးထောင့်',100,570000,675000,32,1,NULL,0,0,NULL),(7,'MK-190902','MK Belt ညို',100,350000,450000,34,1,NULL,0,0,NULL),(8,'MK-190901','MK Wallet New (Black) (Sliver)',100,350000,450000,32,1,NULL,0,0,NULL),(9,'FF-190901','Fitflop (ကျောက်ပါအပါး)(38)',100,260000,315000,33,1,NULL,0,0,NULL),(10,'GL-190901','Guy Laroche Wallet Blue',100,275000,295000,32,1,NULL,0,0,NULL),(11,'BA-190909','Bonia Black ကွင်းပါ',94,796000,985000,32,1,NULL,0,0,NULL),(12,'CQ-190901','Clinique Happy (heart)',100,99000,125000,47,1,NULL,0,0,NULL),(13,'BA-190908','Bonia wallet New',100,395000,445000,32,1,NULL,0,0,NULL),(14,'BA-190907','Bonia စိမ်းညို့ရောင်ကွပ်',100,890000,995000,32,1,NULL,0,0,NULL),(15,'BA-190906','Bonia မြင်းချေးရောင်',100,895000,995000,32,1,NULL,0,0,NULL),(16,'BA-190905','Bonia လခြမ်း',100,880000,995000,32,1,NULL,0,0,NULL),(17,'BA-190904','Bonia လဝိုင်း အညို',100,795000,855000,32,1,NULL,0,0,NULL),(18,'BA-190903','Bonia အနက်လုံး',100,850000,995000,32,1,NULL,0,0,NULL),(19,'BA-190902','Bonia အနက် hand back ရွှေရောင်းကြိုး',100,995000,1095000,32,1,NULL,0,0,NULL),(20,'BA-190901','Bonia ညို ဖြူကွပ်',100,600000,700000,32,1,NULL,0,0,NULL),(21,'VS-190901','Versace belt',100,1790000,1885000,34,1,NULL,0,0,NULL),(22,'BA-160905','Bonia Handbag သေး',99,778000,950000,32,1,NULL,0,0,NULL),(23,'BA-160904','Bonia Handbag စာသားပါ (Black) (Cream)',98,1050000,1155000,32,1,NULL,0,0,NULL),(24,'BA-160903','Bonia Handbag လက်ချိတ်',98,835000,945000,32,1,NULL,0,0,NULL),(25,'BA-160902','Bonia Handbag',99,750000,925000,32,1,NULL,0,0,NULL),(26,'BA-160901','Bonia Wallet',100,286000,328000,32,1,NULL,0,0,NULL),(27,'CH-110902','Coach Black',100,945000,1045000,32,1,NULL,0,0,NULL),(28,'MK-120902','MK Brown Belt',100,385000,415000,34,1,NULL,0,0,NULL),(29,'MK-120901','MK Brown အနက် ကွပ်',100,589000,625000,32,1,NULL,0,0,NULL),(30,'VS-110901','Versace Belt ရွှေ',100,1450000,1550000,34,1,NULL,0,0,NULL),(31,'CH-110901','Coach handbag ပန်း ကွပ်',100,496500,598000,32,1,NULL,0,0,NULL),(32,'YSL-110902','YSL Perfume For Men',100,565000,665000,47,1,NULL,0,0,NULL),(33,'BW-110902','Bonia Couple Watch (မ)',100,507000,657000,50,1,NULL,0,0,NULL),(34,'BW-110901','Bonia Couple Watch (ကျား)',100,507000,667000,50,1,NULL,0,0,NULL),(35,'Di-110902','Dior Set',100,605000,693500,40,1,NULL,0,0,NULL),(36,'Di-110901','Dior Lip Glow',100,195000,215000,39,1,NULL,0,0,NULL),(37,'SK-110901','SKII Mini Set',100,236000,258000,40,1,NULL,0,0,NULL),(38,'MK-110904','MK Wallet (White) (Brown) (Black)',100,310000,388000,32,1,NULL,0,0,NULL),(39,'MK-110903','MK Black ရွှေကြိုး',100,570000,645000,32,1,NULL,0,0,NULL),(40,'MK-110902','MK White ပန်းကွတ်',100,490000,585000,32,1,NULL,0,0,NULL),(41,'MK-110901','MK ကြီး နက်',100,610000,685000,32,1,NULL,0,0,NULL),(42,'PDP-110901','Prada Candy Perfume',100,465000,525000,47,1,NULL,0,0,NULL),(43,'FB-110901','Flower Bomb Perfume',100,415000,485000,47,1,NULL,0,0,NULL),(44,'YSL-110901','YSL Mon Paris Perfume',100,585000,685000,47,1,NULL,0,0,NULL),(45,'EL-110901','Estee Lauder Perfume',100,345000,398000,47,1,NULL,0,0,NULL),(46,'TB-020911','Tory Burch  နက်',100,1200000,1250000,32,1,NULL,0,0,NULL),(47,'BT-020901','Bata Shoe (စိမ်းဖျော့)',84,45000,55000,33,1,NULL,0,0,NULL),(48,'VNC-020902','VNC Sandal (Gray) (5)',100,35000,35000,33,1,NULL,0,0,NULL),(49,'ZR-020901','ZARA နက် (39)',100,83000,93000,33,1,NULL,0,0,NULL),(182,'VNC-020901123','VNC Sandal (Black/8) (Pink/7)',195,78000,88000,33,2,'/assets/purchase/purchase_1765808198808_322748849.jpg',0,0,NULL),(183,'TB-0209011234','Tory Burch Shoe Black (9)',197,550000,650000,33,2,NULL,0,0,NULL),(184,'PD-020901','PRADA ဒေါက်မြင့် နက် China (39)',200,49000,55000,33,2,NULL,0,0,NULL),(185,'BB-020901','Burberry Sandal (Black/40) (Cream/39)',200,39500,49500,33,2,NULL,0,0,NULL),(186,'BA-020920','Bonia Sandal (39) (စာသားပါ)',200,400000,465000,33,2,NULL,0,0,NULL),(187,'BA-020919','Bonia Sandal (39)',200,400000,465000,33,2,NULL,0,0,NULL),(188,'BA-020918','Bonia Shoe (အပါး) (39)',200,400000,465000,33,2,NULL,0,0,NULL),(189,'BA-020917','Bonia Shoe (ထိပ်ချွန်) နက်ပြောင် (38)',200,435000,485000,33,2,NULL,0,0,NULL),(190,'BA-020916','Bonia Shoe (အပါး) (36)',200,400000,465000,33,2,NULL,0,0,NULL),(191,'BA-020915','Bonia Shoe (ထိပ်လုံး) brown (40)',200,435000,485000,33,2,NULL,0,0,NULL),(192,'BA-020914','Bonia Shoe (ထိပ်ပြား) နက်ပြောင် (40)',200,435000,485000,33,2,NULL,0,0,NULL),(193,'BA-020913','Bonia Shoe (Logo) Cream',200,450000,515000,33,2,NULL,0,0,NULL),(194,'BA-020912','Bonia Shoe (ပုံရိုး) (မြင့်) Black',400,435000,485000,33,2,NULL,0,0,NULL),(195,'BA-020911','Bonia Shoe (B၂လုံးပါ) (36) (40)',200,435000,485000,33,2,NULL,0,0,NULL),(196,'FF-020908','Fitflop (ပွင့်ဖတ်ပုံ)  (36)  Pepsi',200,235000,385000,33,2,NULL,0,0,NULL),(197,'FF-020907','Fitflop (ကျောက်ပါအပါး)  (36) (37) Black',200,260000,315000,33,2,NULL,0,0,NULL),(198,'FF-020906','Fitflop (ကျောက်ပါအပါး)  (37) Nude',200,260000,315000,33,2,NULL,0,0,NULL),(199,'FF-020905','Fitflop (စိန်လေးထောင့်ပုံ)  (38) (နက်ပြာ)',200,350000,415000,33,2,NULL,0,0,NULL),(200,'FF-020904','Fitflop (ပန်း၃ပွင့်ပုံ)  (39) (နက်ပြာ)',200,410000,478000,33,2,NULL,0,0,NULL),(201,'FF-020903','Fitflop (သစ်ခက်ပုံ)  (36) (နက်)',200,350000,415000,33,2,NULL,0,0,NULL),(202,'FF-020902','Fitflop (သစ်ခက်ပုံ)  (37) (ခရမ်း)',200,350000,415000,33,2,NULL,0,0,NULL),(203,'FF-020901','Fitflop Black (36) (38) (41)',200,410000,468000,33,2,NULL,0,0,NULL),(204,'KPK-010900','Kopiko Coffee',2000,10000,11500,46,2,NULL,0,0,NULL),(205,'BA-010909','Bonia New (ခြင်းတောင်း) (နက်) (ညို)',198,769000,889000,32,2,NULL,0,0,NULL),(206,'BA-010908','Bonia New (နီညို/အောက် ၃မြောင့်)',200,630000,785000,32,2,NULL,0,0,NULL),(207,'BA-010907','Bonia New (နက်/သေး)',200,725000,775000,32,2,NULL,0,0,NULL),(208,'BA-010906','Bonia New (ရိုးရိုး/နက် ၂လိုင်း)',200,795000,895000,32,2,NULL,0,0,NULL),(209,'BA-010905','Bonia New (အနက် ကွပ်)',200,900000,955000,32,2,NULL,0,0,NULL),(210,'BA-010904','Bonia New (ညို/အနက် ၂လိုင်း)',200,700000,788000,32,2,NULL,0,0,NULL),(211,'BA-010903','Bonia New (အနက် ခြင်းတောင်း)',200,800000,885000,32,2,NULL,0,0,NULL),(212,'BA-010902','Bonia New (အဖုံး စာသား)',200,850000,950000,32,2,NULL,0,0,NULL),(213,'BA-010901','Bonia New (ချော့ကလက် ကိုင်း)',200,770000,885000,32,2,NULL,0,0,NULL),(214,'MD-010901','MossDoom လွယ် အသား',200,70000,95000,32,2,NULL,0,0,NULL),(215,'GL-010911','Guy Laroche ခါးပတ်',200,105000,185000,34,2,NULL,0,0,NULL),(216,'AW-010911','Arrow ခါးပတ်',187,105000,165000,34,2,NULL,0,0,NULL),(217,'DS-010922','DAKS Belt ခေါင်းသေး',200,180000,225000,34,2,NULL,0,0,NULL),(218,'DS-010911','DAKS Belt ခေါင်းကြီး',200,225000,275000,34,2,NULL,0,0,NULL),(219,'FF-010905','Fitflop EU-37 (ပါး) ရွှေဖျော့/အသား',200,280000,325000,33,2,NULL,0,0,NULL),(220,'FF-010904','Fitflop EU-37/38 (နက်/ပါး)',200,280000,325000,33,2,NULL,0,0,NULL),(221,'UQ-010904','UniQlo Shirt (ကျား) ဖြူ XL',200,47000,65000,48,2,NULL,0,0,NULL),(222,'GL-010901','Guy Laroche Shirt (ကျား) နက်/ပြာ/ဖြူ M',200,48000,68000,48,2,NULL,0,0,NULL),(223,'UQ-010903','UniQlo Shirt (မ/ရှည်/ပန်း)',200,119000,149000,49,2,NULL,0,0,NULL),(224,'UQ-010902','UniQlo Shirt (မ/ရှည်/ပြာဖြူဖောက်) L/M',200,119000,149000,49,2,NULL,0,0,NULL),(225,'UQ-010901','UniQlo Shirt (မ/ရှည်/ပြာနု) S',200,119000,149000,49,2,NULL,0,0,NULL),(226,'4164295847495','Facial Form',99,1000,1100,40,2,NULL,0,0,NULL),(227,'3129989927262','ToothPaste',90,1000,1100,40,1,NULL,0,0,NULL),(229,'3497761411348','item a',99,2500,3000,40,1,'/assets/purchase/purchase_1767707068573_194181638.jpg',0,0,NULL),(230,'4679175921288','item b',100,3000,4000,40,1,NULL,0,0,NULL),(231,'1001','အဆင်',50,500,700,NULL,2,NULL,0,0,NULL),(232,'1002','ပြေလား',53,600,800,NULL,2,NULL,0,0,NULL),(233,'1003','အဆင်',10,1200,1500,NULL,2,NULL,0,0,NULL),(235,'8850679071795','make up',120,500,600,40,1,NULL,0,0,NULL),(237,'1541541882026','testing 123 QTY',25,1500,1800,51,1,NULL,0,0,NULL);
/*!40000 ALTER TABLE `tblremain` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tblsale`
--

DROP TABLE IF EXISTS `tblsale`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tblsale` (
  `AID` int(11) NOT NULL AUTO_INCREMENT,
  `ItemName` varchar(100) DEFAULT NULL,
  `Qty` int(11) DEFAULT NULL,
  `SellPrice` float DEFAULT NULL,
  `Date` datetime DEFAULT NULL,
  `VNO` varchar(45) DEFAULT NULL,
  `CustomerID` int(11) DEFAULT NULL,
  `RemainID` int(11) DEFAULT NULL,
  `CodeNo` varchar(45) DEFAULT NULL,
  `RegisterKey` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`AID`)
) ENGINE=InnoDB AUTO_INCREMENT=57 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tblsale`
--

LOCK TABLES `tblsale` WRITE;
/*!40000 ALTER TABLE `tblsale` DISABLE KEYS */;
INSERT INTO `tblsale` VALUES (1,'Arrow ခါးပတ်',2,165000,'2025-12-08 04:15:11','VN202512080049',9,128,'AW-010911',NULL),(2,'Bata Shoe (စိမ်းဖျော့)',2,55000,'2025-12-08 04:15:11','VN202512080049',9,47,'BT-020901',NULL),(4,'Arrow ခါးပတ်',1,165000,'2025-12-08 05:50:33','VN202512080103',9,128,'AW-010911',NULL),(9,'Arrow ခါးပတ်',1,165000,'2025-12-08 09:29:22','VN202512080381',9,128,'AW-010911',NULL),(10,'Bata Shoe (စိမ်းဖျော့)',1,55000,'2025-12-08 09:29:22','VN202512080381',9,47,'BT-020901',NULL),(11,'Arrow ခါးပတ်',1,165000,'2025-12-15 14:26:23','VN202512150019',9,172,'AW-010911',NULL),(12,'Bata Shoe (စိမ်းဖျော့)',1,55000,'2025-12-15 14:26:23','VN202512150019',9,47,'BT-020901',NULL),(13,'Bonia Black ကွင်းပါ',1,985000,'2025-12-15 14:26:23','VN202512150019',9,11,'BA-190909',NULL),(14,'Arrow ခါးပတ်',1,165000,'2025-12-21 14:44:39','VN202512210011',9,172,'AW-010911',NULL),(15,'Bata Shoe (စိမ်းဖျော့)',1,55000,'2025-12-21 14:44:39','VN202512210011',9,47,'BT-020901',NULL),(16,'Arrow ခါးပတ်',1,165000,'2025-12-21 14:45:22','VN202512210012',9,172,'AW-010911',NULL),(17,'Bata Shoe (စိမ်းဖျော့)',1,55000,'2025-12-21 14:45:22','VN202512210012',9,47,'BT-020901',NULL),(18,'Arrow ခါးပတ်',1,165000,'2025-12-21 14:45:43','VN202512210013',24,172,'AW-010911',NULL),(19,'Bata Shoe (စိမ်းဖျော့)',1,55000,'2025-12-21 14:45:43','VN202512210013',24,47,'BT-020901',NULL),(20,'Arrow ခါးပတ်',1,165000,'2025-12-21 14:47:03','VN202512210014',9,172,'AW-010911',NULL),(21,'Arrow ခါးပတ်',1,165000,'2025-12-30 15:42:54','VN202512300025',9,172,'AW-010911',NULL),(22,'Bata Shoe (စိမ်းဖျော့)',1,55000,'2025-12-30 15:42:54','VN202512300025',9,47,'BT-020901',NULL),(23,'Bonia New (ခြင်းတောင်း) (နက်) (ညို)',1,889000,'2025-12-30 15:49:09','VN202512300033',24,161,'BA-010909',NULL),(24,'Bonia New (ညို/အနက် ၂လိုင်း)',1,788000,'2025-12-30 15:49:09','VN202512300033',24,166,'BA-010904',NULL),(25,'Arrow ခါးပတ်',1,165000,'2025-12-30 17:05:43','VN202512300133',68,216,'AW-010911',NULL),(26,'Bonia New (ခြင်းတောင်း) (နက်) (ညို)',1,889000,'2025-12-30 17:47:46','VN202512300137',65,205,'BA-010909',NULL),(27,'Bata Shoe (စိမ်းဖျော့)',1,55000,'2025-12-31 03:56:31','VN202512300001',9,47,'BT-020901',NULL),(28,'Bata Shoe (စိမ်းဖျော့)',2,55000,'2026-01-05 06:08:12','VN202601040005',9,47,'BT-020901',NULL),(29,'Bonia Black ကွင်းပါ',2,985000,'2026-01-05 06:08:12','VN202601040005',9,11,'BA-190909',NULL),(30,'Arrow ခါးပတ်',2,165000,'2026-01-05 17:08:20','VN202601050003',9,216,'AW-010911',NULL),(31,'Bonia Black ကွင်းပါ',1,985000,'2026-01-05 17:08:20','VN202601050003',9,11,'BA-190909',NULL),(32,'Bata Shoe (စိမ်းဖျော့)',1,55000,'2026-01-05 17:08:20','VN202601050003',9,47,'BT-020901',NULL),(33,'Arrow ခါးပတ်',2,165000,'2026-01-06 07:18:53','VN202601060007',9,216,'AW-010911',NULL),(34,'Arrow ခါးပတ်',10,165000,'2026-01-06 07:26:43','VN202601060025',9,216,'AW-010911',NULL),(35,'Arrow ခါးပတ်',1,165000,'2026-01-06 07:27:48','VN202601060026',84,216,'AW-010911',NULL),(36,'Bata Shoe (စိမ်းဖျော့)',1,55000,'2026-01-06 07:27:48','VN202601060026',84,47,'BT-020901',NULL),(37,'Bonia Black ကွင်းပါ',1,985000,'2026-01-06 07:27:48','VN202601060026',84,11,'BA-190909',NULL),(38,'Arrow ခါးပတ်',2,165000,'2026-01-06 13:26:30','VN202601060001',9,216,'AW-010911',NULL),(39,'Bata Shoe (စိမ်းဖျော့)',1,55000,'2026-01-06 13:26:30','VN202601060001',9,47,'BT-020901',NULL),(40,'Bonia Black ကွင်းပါ',1,985000,'2026-01-06 13:26:30','VN202601060001',9,11,'BA-190909',NULL),(41,'Arrow ခါးပတ်',1,165000,'2026-01-06 13:42:38','VN202601060017',9,216,'AW-010911',NULL),(42,'Bata Shoe (စိမ်းဖျော့)',1,55000,'2026-01-06 13:42:38','VN202601060017',9,47,'BT-020901',NULL),(44,'Bonia Handbag စာသားပါ (Black) (Cream)',1,1155000,'2026-01-06 13:55:14','VN202601060024',9,23,'BA-160904',NULL),(45,'Bonia Handbag လက်ချိတ်',1,945000,'2026-01-06 13:55:14','VN202601060024',9,24,'BA-160903',NULL),(46,'Arrow ခါးပတ်',1,165000,'2026-01-09 07:01:00','VN202601090003',94,216,'AW-010911',NULL),(47,'Bata Shoe (စိမ်းဖျော့)',1,55000,'2026-01-09 07:01:00','VN202601090003',94,47,'BT-020901',NULL),(48,'Bonia Handbag',1,925000,'2026-01-09 07:09:47','VN202601090005',94,25,'BA-160902',NULL),(49,'Bonia Handbag စာသားပါ (Black) (Cream)',1,1155000,'2026-01-09 07:09:47','VN202601090005',94,23,'BA-160904',NULL),(50,'Bonia Handbag လက်ချိတ်',1,945000,'2026-01-09 07:11:22','VN202601090006',9,24,'BA-160903',NULL),(51,'Bonia Handbag သေး',1,950000,'2026-01-09 07:11:22','VN202601090006',9,22,'BA-160905',NULL),(52,'Arrow ခါးပတ်',1,165000,'2026-01-09 07:48:55','VN202601090014',9,216,'AW-010911',NULL),(53,'Bonia New (ခြင်းတောင်း) (နက်) (ညို)',1,889000,'2026-01-09 07:48:55','VN202601090014',9,205,'BA-010909',NULL),(54,'Bonia New (အနက် ခြင်းတောင်း)',1,885000,'2026-01-09 07:48:55','VN202601090014',9,211,'BA-010903',NULL),(55,'Facial Form',1,1100,'2026-01-11 10:10:46','VN202601110009',95,226,'4164295847495',NULL),(56,'item a',1,3000,'2026-01-11 10:10:46','VN202601110009',95,229,'3497761411348',NULL);
/*!40000 ALTER TABLE `tblsale` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tblsale_return`
--

DROP TABLE IF EXISTS `tblsale_return`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tblsale_return` (
  `AID` int(11) NOT NULL AUTO_INCREMENT,
  `VNO` varchar(45) DEFAULT NULL,
  `RemainID` int(11) DEFAULT NULL,
  `Price` float DEFAULT NULL,
  `OldQty` int(11) DEFAULT NULL,
  `ReturnQty` int(11) DEFAULT NULL,
  `RefundSubtotal` float DEFAULT NULL,
  `Date` date DEFAULT NULL,
  PRIMARY KEY (`AID`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tblsale_return`
--

LOCK TABLES `tblsale_return` WRITE;
/*!40000 ALTER TABLE `tblsale_return` DISABLE KEYS */;
INSERT INTO `tblsale_return` VALUES (4,'VN202512300033',161,889000,1,1,889000,'2025-12-30'),(5,'VN202601050003',216,165000,2,1,165000,'2026-01-05'),(6,'VN202601060025',216,165000,10,5,825000,'2026-01-06'),(7,'VN202601060001',216,165000,2,1,165000,'2026-01-06'),(8,'VN202601090014',216,165000,1,1,165000,'2026-01-11'),(9,'VN202601090014',211,885000,1,1,885000,'2026-01-11');
/*!40000 ALTER TABLE `tblsale_return` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tblsale_return_voucher`
--

DROP TABLE IF EXISTS `tblsale_return_voucher`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tblsale_return_voucher` (
  `AID` int(11) NOT NULL AUTO_INCREMENT,
  `VNO` varchar(45) DEFAULT NULL,
  `CustomerID` int(11) DEFAULT NULL,
  `Reason` varchar(200) DEFAULT NULL,
  `OriginalTotal` float DEFAULT NULL,
  `RefundTotal` float DEFAULT NULL,
  `Date` date DEFAULT NULL,
  `UserID` int(11) DEFAULT NULL,
  PRIMARY KEY (`AID`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tblsale_return_voucher`
--

LOCK TABLES `tblsale_return_voucher` WRITE;
/*!40000 ALTER TABLE `tblsale_return_voucher` DISABLE KEYS */;
INSERT INTO `tblsale_return_voucher` VALUES (4,'VN202512300033',24,'defective',1659900,889000,'2025-12-30',1),(5,'VN202601050003',9,'defective',1370000,165000,'2026-01-05',1),(6,'VN202601060025',9,'defective',1650000,825000,'2026-01-06',1),(7,'VN202601060001',9,'other',1370000,165000,'2026-01-06',1),(8,'VN202601090014',9,'defective',1939000,1050000,'2026-01-11',1);
/*!40000 ALTER TABLE `tblsale_return_voucher` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tblsale_temp`
--

DROP TABLE IF EXISTS `tblsale_temp`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tblsale_temp` (
  `AID` int(11) NOT NULL AUTO_INCREMENT,
  `ItemName` varchar(100) DEFAULT NULL,
  `Qty` int(11) DEFAULT NULL,
  `SellPrice` double DEFAULT 0,
  `Date` datetime DEFAULT NULL,
  `VNO` varchar(45) DEFAULT NULL,
  `CustomerID` int(11) DEFAULT NULL,
  `RemainID` int(11) DEFAULT NULL,
  `CodeNo` varchar(45) DEFAULT NULL,
  `UserID` int(11) DEFAULT NULL,
  PRIMARY KEY (`AID`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tblsale_temp`
--

LOCK TABLES `tblsale_temp` WRITE;
/*!40000 ALTER TABLE `tblsale_temp` DISABLE KEYS */;
/*!40000 ALTER TABLE `tblsale_temp` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tblsetting`
--

DROP TABLE IF EXISTS `tblsetting`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tblsetting` (
  `AID` int(11) NOT NULL AUTO_INCREMENT,
  `ShopName` varchar(100) DEFAULT NULL,
  `Address` varchar(100) DEFAULT NULL,
  `PhoneNo` varchar(45) DEFAULT NULL,
  `Logo` varchar(100) DEFAULT NULL,
  `ChkLogo` int(11) DEFAULT 0,
  PRIMARY KEY (`AID`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tblsetting`
--

LOCK TABLES `tblsetting` WRITE;
/*!40000 ALTER TABLE `tblsetting` DISABLE KEYS */;
INSERT INTO `tblsetting` VALUES (2,'Parent\'s Love','ညောင်ဉီး','09-799288937','/assets/printsetting/logo_1765032116841_639473113.jpg',0);
/*!40000 ALTER TABLE `tblsetting` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tblstaff`
--

DROP TABLE IF EXISTS `tblstaff`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tblstaff` (
  `AID` int(11) NOT NULL AUTO_INCREMENT,
  `StaffName` varchar(100) DEFAULT NULL,
  `Email` varchar(45) DEFAULT NULL,
  `PhoneNo` varchar(45) DEFAULT NULL,
  `Address` varchar(150) DEFAULT NULL,
  `Gender` varchar(45) DEFAULT NULL,
  `FatherName` varchar(45) DEFAULT NULL,
  `Salary` double DEFAULT 0,
  `RegisterKey` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`AID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tblstaff`
--

LOCK TABLES `tblstaff` WRITE;
/*!40000 ALTER TABLE `tblstaff` DISABLE KEYS */;
/*!40000 ALTER TABLE `tblstaff` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tblsupplier`
--

DROP TABLE IF EXISTS `tblsupplier`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tblsupplier` (
  `AID` int(11) NOT NULL AUTO_INCREMENT,
  `Supplier` varchar(100) DEFAULT NULL,
  `Address` varchar(150) DEFAULT NULL,
  `Email` varchar(45) DEFAULT NULL,
  `PhoneNo` varchar(45) DEFAULT NULL,
  `RegisterKey` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`AID`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tblsupplier`
--

LOCK TABLES `tblsupplier` WRITE;
/*!40000 ALTER TABLE `tblsupplier` DISABLE KEYS */;
INSERT INTO `tblsupplier` VALUES (1,'MMS Branded Collection','အမှတ်(ပ/၂၃၈၃၈)၊ ချယ်ရီ(၇)လမ်း၊ မင်္ဂလာဒီပရပ်ကွက်၊ ပုဗ္ဗသီရိမြို့နယ်၊ နေပြည်တော်။','nyimie@mmsbranded.com','095042324, 09695512223',NULL),(2,'Nyein Chan company','bago\nWaw','nc@gmail.com','9795854059',NULL);
/*!40000 ALTER TABLE `tblsupplier` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tblsupplierdetail`
--

DROP TABLE IF EXISTS `tblsupplierdetail`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tblsupplierdetail` (
  `AID` int(11) NOT NULL AUTO_INCREMENT,
  `SupplierID` int(11) DEFAULT NULL,
  `PurchaseID` int(11) DEFAULT NULL,
  `Amt` double DEFAULT 0,
  `Date` date DEFAULT NULL,
  PRIMARY KEY (`AID`)
) ENGINE=InnoDB AUTO_INCREMENT=256 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tblsupplierdetail`
--

LOCK TABLES `tblsupplierdetail` WRITE;
/*!40000 ALTER TABLE `tblsupplierdetail` DISABLE KEYS */;
INSERT INTO `tblsupplierdetail` VALUES (1,1,1,20000,'2025-12-08'),(2,1,2,73000000,'2025-12-08'),(3,1,3,79500000,'2025-12-08'),(4,1,4,26800000,'2025-12-08'),(5,1,5,57000000,'2025-12-08'),(6,1,6,57000000,'2025-12-08'),(7,1,7,35000000,'2025-12-08'),(8,1,8,35000000,'2025-12-08'),(9,1,9,26000000,'2025-12-08'),(10,1,10,27500000,'2025-12-08'),(11,1,11,79600000,'2025-12-08'),(12,1,12,9900000,'2025-12-08'),(13,1,13,39500000,'2025-12-08'),(14,1,14,89000000,'2025-12-08'),(15,1,15,89500000,'2025-12-08'),(16,1,16,88000000,'2025-12-08'),(17,1,17,79500000,'2025-12-08'),(18,1,18,85000000,'2025-12-08'),(19,1,19,99500000,'2025-12-08'),(20,1,20,60000000,'2025-12-08'),(21,1,21,179000000,'2025-12-08'),(22,1,22,77800000,'2025-12-08'),(23,1,23,105000000,'2025-12-08'),(24,1,24,83500000,'2025-12-08'),(25,1,25,75000000,'2025-12-08'),(26,1,26,28600000,'2025-12-08'),(27,1,27,94500000,'2025-12-08'),(28,1,28,38500000,'2025-12-08'),(29,1,29,58900000,'2025-12-08'),(30,1,30,145000000,'2025-12-08'),(31,1,31,49650000,'2025-12-08'),(32,1,32,56500000,'2025-12-08'),(33,1,33,50700000,'2025-12-08'),(34,1,34,50700000,'2025-12-08'),(35,1,35,60500000,'2025-12-08'),(36,1,36,19500000,'2025-12-08'),(37,1,37,23600000,'2025-12-08'),(38,1,38,31000000,'2025-12-08'),(39,1,39,57000000,'2025-12-08'),(40,1,40,49000000,'2025-12-08'),(41,1,41,61000000,'2025-12-08'),(42,1,42,46500000,'2025-12-08'),(43,1,43,41500000,'2025-12-08'),(44,1,44,58500000,'2025-12-08'),(45,1,45,34500000,'2025-12-08'),(46,1,46,120000000,'2025-12-08'),(47,1,47,4500000,'2025-12-08'),(48,1,48,3500000,'2025-12-08'),(49,1,49,8300000,'2025-12-08'),(182,2,182,15600000,'2025-12-30'),(183,2,183,110000000,'2025-12-30'),(184,2,184,9800000,'2025-12-30'),(185,2,185,7900000,'2025-12-30'),(186,2,186,80000000,'2025-12-30'),(187,2,187,80000000,'2025-12-30'),(188,2,188,80000000,'2025-12-30'),(189,2,189,87000000,'2025-12-30'),(190,2,190,80000000,'2025-12-30'),(191,2,191,87000000,'2025-12-30'),(192,2,192,87000000,'2025-12-30'),(193,2,193,90000000,'2025-12-30'),(194,2,194,174000000,'2025-12-30'),(195,2,195,87000000,'2025-12-30'),(196,2,196,47000000,'2025-12-30'),(197,2,197,52000000,'2025-12-30'),(198,2,198,52000000,'2025-12-30'),(199,2,199,70000000,'2025-12-30'),(200,2,200,82000000,'2025-12-30'),(201,2,201,70000000,'2025-12-30'),(202,2,202,70000000,'2025-12-30'),(203,2,203,82000000,'2025-12-30'),(204,2,204,20000000,'2025-12-30'),(205,2,205,153800000,'2025-12-30'),(206,2,206,126000000,'2025-12-30'),(207,2,207,145000000,'2025-12-30'),(208,2,208,159000000,'2025-12-30'),(209,2,209,180000000,'2025-12-30'),(210,2,210,140000000,'2025-12-30'),(211,2,211,160000000,'2025-12-30'),(212,2,212,170000000,'2025-12-30'),(213,2,213,154000000,'2025-12-30'),(214,2,214,14000000,'2025-12-30'),(215,2,215,21000000,'2025-12-30'),(216,2,216,21000000,'2025-12-30'),(217,2,217,36000000,'2025-12-30'),(218,2,218,45000000,'2025-12-30'),(219,2,219,56000000,'2025-12-30'),(220,2,220,56000000,'2025-12-30'),(221,2,221,9400000,'2025-12-30'),(222,2,222,9600000,'2025-12-30'),(223,2,223,23800000,'2025-12-30'),(224,2,224,23800000,'2025-12-30'),(225,2,225,23800000,'2025-12-30'),(226,2,226,100000,'2026-01-05'),(227,1,227,100000,'2026-01-05'),(229,1,229,250000,'2026-01-06'),(230,1,230,300000,'2026-01-06'),(247,1,247,60000,'2026-01-14'),(248,1,248,7500,'2026-01-14'),(249,1,249,12000,'2026-01-14'),(250,1,250,6000,'2026-01-14'),(251,2,251,17500,'2026-01-14'),(252,2,252,19800,'2026-01-14'),(253,2,253,6000,'2026-01-14'),(255,1,255,37500,'2026-01-14');
/*!40000 ALTER TABLE `tblsupplierdetail` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tblsupplierpay`
--

DROP TABLE IF EXISTS `tblsupplierpay`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tblsupplierpay` (
  `AID` int(11) NOT NULL AUTO_INCREMENT,
  `SupplierID` int(11) DEFAULT NULL,
  `Amt` double DEFAULT 0,
  `Date` date DEFAULT NULL,
  `UserID` int(11) DEFAULT NULL,
  `Rmk` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`AID`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tblsupplierpay`
--

LOCK TABLES `tblsupplierpay` WRITE;
/*!40000 ALTER TABLE `tblsupplierpay` DISABLE KEYS */;
INSERT INTO `tblsupplierpay` VALUES (3,3,10000,'2023-03-16',1,NULL),(4,9,100,'2023-04-02',1,NULL),(5,10,1000,'2023-05-21',1,NULL),(13,2,100000,'2025-12-08',1,NULL),(14,2,1000000,'2025-12-08',1,NULL),(15,2,100000,'2026-01-06',1,NULL),(16,1,27000,'2026-01-06',1,NULL);
/*!40000 ALTER TABLE `tblsupplierpay` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tbluser`
--

DROP TABLE IF EXISTS `tbluser`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tbluser` (
  `AID` int(11) NOT NULL AUTO_INCREMENT,
  `UserName` varchar(45) DEFAULT NULL,
  `Password` varchar(45) DEFAULT NULL,
  `Status` varchar(45) DEFAULT 'Null',
  `Permission` text DEFAULT NULL,
  PRIMARY KEY (`AID`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tbluser`
--

LOCK TABLES `tbluser` WRITE;
/*!40000 ALTER TABLE `tbluser` DISABLE KEYS */;
INSERT INTO `tbluser` VALUES (1,'admin','1','Active','sale,purchase,reports,setting,expense,user,financial,customer,ai,sale-return'),(5,'user','1','Active','sale,purchase'),(6,'staff1','1','Active','sale'),(7,'userone','1','Active','sale,sale-return'),(8,'staff','1','Active','sale,sale-return');
/*!40000 ALTER TABLE `tbluser` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tblvoucher`
--

DROP TABLE IF EXISTS `tblvoucher`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tblvoucher` (
  `AID` int(11) NOT NULL AUTO_INCREMENT,
  `VNO` varchar(45) DEFAULT NULL,
  `CustomerID` int(11) DEFAULT NULL,
  `TotalQty` int(11) DEFAULT 0,
  `TotalAmt` float DEFAULT 0,
  `Dis` float DEFAULT 0,
  `Tax` float DEFAULT 0,
  `Total` float DEFAULT 0,
  `UserID` int(11) DEFAULT NULL,
  `Cash` float DEFAULT 0,
  `Refund` float DEFAULT 0,
  `Date` datetime DEFAULT NULL,
  `Credit` float DEFAULT 0,
  `Chk` varchar(45) DEFAULT 'Cash',
  `PaymentMethod` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`AID`)
) ENGINE=InnoDB AUTO_INCREMENT=32 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tblvoucher`
--

LOCK TABLES `tblvoucher` WRITE;
/*!40000 ALTER TABLE `tblvoucher` DISABLE KEYS */;
INSERT INTO `tblvoucher` VALUES (1,'VN202512080049',9,4,440000,0,0,440000,1,450000,330000,'2025-12-08 04:15:11',0,'Cash',NULL),(3,'VN202512080103',9,1,165000,0,0,165000,1,170000,5000,'2025-12-08 05:50:33',0,'Cash',NULL),(7,'VN202512080381',9,2,220000,0,0,220000,1,202000,0,'2025-12-08 09:29:22',18000,'Credit',NULL),(8,'VN202512150019',9,3,1205000,0,0,1205000,1,1300000,95000,'2025-12-15 14:26:23',0,'Cash',NULL),(9,'VN202512210011',9,2,220000,0,0,220000,1,220000,0,'2025-12-21 14:44:39',0,'Cash',NULL),(10,'VN202512210012',9,2,220000,0,0,220000,1,230000,10000,'2025-12-21 14:45:22',0,'Cash',NULL),(11,'VN202512210013',24,2,220000,0,0,220000,1,229999,9999,'2025-12-21 14:45:43',0,'Cash',NULL),(12,'VN202512210014',9,1,165000,0,0,165000,1,170000,5000,'2025-12-21 14:47:03',0,'Cash',NULL),(13,'VN202512300025',9,2,220000,0,0,220000,1,220000,0,'2025-12-30 15:42:54',0,'Cash','KPay'),(14,'VN202512300033',24,2,1677000,33540,16435,1659900,1,1660000,889000,'2025-12-30 15:49:09',0,'Return','Cash'),(15,'VN202512300133',68,1,165000,0,0,165000,1,165000,0,'2025-12-30 17:05:43',0,'Cash','Cash'),(16,'VN202512300137',65,1,889000,0,0,889000,1,900000,11000,'2025-12-30 17:47:46',0,'Cash','Cash'),(17,'VN202512300001',9,1,55000,0,0,55000,1,55000,0,'2025-12-31 03:56:31',0,'Cash','KPay'),(18,'VN202601040005',9,4,2080000,0,0,2080000,1,3000000,920000,'2026-01-05 06:08:12',0,'Cash','WavePay'),(19,'VN202601050003',9,4,1370000,0,0,1370000,1,1370000,165000,'2026-01-05 17:08:20',0,'Return','Cash'),(20,'VN202601060007',9,2,330000,0,0,330000,1,330000,0,'2026-01-06 07:18:53',0,'Credit','Credit'),(21,'VN202601060025',9,10,1650000,0,0,1650000,1,1650000,825000,'2026-01-06 07:26:43',0,'Return','Cash'),(22,'VN202601060026',84,3,1205000,0,0,1205000,1,1205000,0,'2026-01-06 07:27:48',0,'Credit','Credit'),(23,'VN202601060001',9,4,1370000,0,0,1370000,1,1380000,165000,'2026-01-06 13:26:30',0,'Return','KPay'),(24,'VN202601060017',9,2,220000,0,0,220000,1,230000,10000,'2026-01-06 13:42:38',0,'Cash','Cash'),(26,'VN202601060024',9,2,2100000,0,0,2100000,1,2200000,99996,'2026-01-06 13:55:14',0,'Cash','Cash'),(27,'VN202601090003',94,2,220000,0,0,220000,1,220000,0,'2026-01-09 07:01:00',0,'Cash','Cash'),(28,'VN202601090005',94,2,2080000,0,0,2080000,1,2080000,0,'2026-01-09 07:09:47',0,'Cash','Cash'),(29,'VN202601090006',9,2,1895000,0,0,1895000,1,2000000,105000,'2026-01-09 07:11:22',0,'Cash','Cash'),(30,'VN202601090014',9,3,1939000,0,0,1939000,1,2000000,1050000,'2026-01-09 07:48:55',0,'Return','KPay'),(31,'VN202601110009',95,2,4100,0,0,4100,1,4000,0,'2026-01-11 10:10:46',100,'Credit','Credit');
/*!40000 ALTER TABLE `tblvoucher` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-01-25 12:58:00
