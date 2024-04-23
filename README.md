# ReachSync
# Project Setup Guide

## 1. Installation of XAMPP

To run this project, you need to install XAMPP. Follow the steps below:

- **Windows:**
  - Download XAMPP from (https://www.apachefriends.org/index.html).
  - Run the installer and follow the installation instructions.
  - Once installed, launch XAMPP Control Panel.

- **macOS:**
  - Download XAMPP from (https://www.apachefriends.org/index.html).
  - Open the downloaded .dmg file and drag the XAMPP folder to your Applications directory.
  - Launch XAMPP from the Applications folder.
- **Linux:**
  - Download XAMPP from [here](https://www.apachefriends.org/index.html).
  - Open your terminal and navigate to the directory where the downloaded file is located.
  - Give execute permissions to the downloaded installer using the command:
    ```
    chmod +x [xampp-installer-filename].run
    ```
  - Run the installer with the command:
    ```
    sudo ./[xampp-installer-filename].run
    ```
  - Follow the installation instructions provided by the installer.

## 2. Node.js Installation

Ensure you have Node.js installed on your system. You can download it from [here](https://nodejs.org/en). Follow the installation instructions provided for your operating system.

## 3. Starting XAMPP

Follow these steps to start XAMPP:

1. Open XAMPP Control Panel.
2. Start the Apache and MySQL modules by clicking on the "Start" button next to them.
3. Once both modules are running, you can proceed with the next steps.

## 4. Database Setup

After starting XAMPP, navigate to http://localhost/phpmyadmin/ in your web browser.

1. Create a new database named `reachsync`.
2. In the SQL tab of the newly created `reachsync` database, execute the following MySQL commands:

-- phpMyAdmin SQL Dump
-- version 5.2.0
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Apr 23, 2024 at 11:03 AM
-- Server version: 10.4.27-MariaDB
-- PHP Version: 8.1.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `reachsync`
--

-- --------------------------------------------------------

--
-- Table structure for table `admin`
--

CREATE TABLE `admin` (
  `apikey` varchar(255) NOT NULL,
  `aname` varchar(50) NOT NULL,
  `email` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `isActive` int(11) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `bot`
--

CREATE TABLE `bot` (
  `id` int(255) NOT NULL,
  `description` text NOT NULL,
  `referencekey` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `channel`
--

CREATE TABLE `channel` (
  `channel_id` varchar(50) NOT NULL,
  `channelName` varchar(30) NOT NULL,
  `apikey` varchar(255) NOT NULL,
  `instance_id` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `company`
--

CREATE TABLE `company` (
  `company_id` varchar(255) NOT NULL,
  `c_name` varchar(255) NOT NULL,
  `c_email` varchar(255) NOT NULL,
  `hostname` varchar(255) NOT NULL,
  `portnumber` int(5) NOT NULL,
  `passcode` varchar(20) NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `contact`
--

CREATE TABLE `contact` (
  `contact_id` varchar(255) NOT NULL,
  `apikey` varchar(255) NOT NULL,
  `name` varchar(255) DEFAULT '-',
  `email` varchar(255) DEFAULT '-',
  `phone` bigint(200) DEFAULT 0,
  `instance_id` varchar(50) NOT NULL,
  `disable` tinyint(4) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `contact_channel`
--

CREATE TABLE `contact_channel` (
  `channel_id` varchar(50) NOT NULL,
  `contact_id` varchar(255) NOT NULL,
  `apikey` varchar(255) NOT NULL,
  `instance_id` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `cstm_template`
--

CREATE TABLE `cstm_template` (
  `cstm_id` varchar(255) NOT NULL,
  `cstm_name` varchar(255) NOT NULL,
  `cstm_msg` longtext NOT NULL,
  `userfields` int(255) NOT NULL,
  `apikey` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `email`
--

CREATE TABLE `email` (
  `email_id` varchar(50) NOT NULL,
  `from_email` varchar(30) NOT NULL,
  `to_email` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `email_type` varchar(30) NOT NULL,
  `subject` varchar(50) NOT NULL,
  `message` mediumtext NOT NULL,
  `instance_id` varchar(50) NOT NULL,
  `apikey` varchar(255) NOT NULL,
  `timestamp` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `instance`
--

CREATE TABLE `instance` (
  `instance_id` varchar(50) NOT NULL,
  `i_name` varchar(30) DEFAULT NULL,
  `apikey` varchar(255) NOT NULL,
  `token` varchar(50) NOT NULL,
  `create_date` date DEFAULT NULL,
  `isActive` int(11) NOT NULL DEFAULT 0,
  `disabled` tinyint(4) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `log`
--

CREATE TABLE `log` (
  `logid` varchar(255) NOT NULL,
  `apikey` varchar(255) NOT NULL,
  `instance_id` varchar(255) NOT NULL,
  `api` varchar(255) NOT NULL,
  `requestbody` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `type` varchar(1) NOT NULL,
  `logtime` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=MyISAM DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `message`
--

CREATE TABLE `message` (
  `msgid` varchar(50) NOT NULL,
  `msg` longtext NOT NULL,
  `msg_type` text NOT NULL,
  `receiver` varchar(20) NOT NULL,
  `instance_id` varchar(50) NOT NULL,
  `apikey` varchar(50) NOT NULL,
  `token` varchar(50) NOT NULL,
  `time` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `plans`
--

CREATE TABLE `plans` (
  `planid` int(11) NOT NULL,
  `pname` varchar(40) NOT NULL,
  `price` int(11) NOT NULL,
  `durationMonth` int(11) NOT NULL,
  `totalInstance` int(11) NOT NULL,
  `totalMessage` int(11) NOT NULL,
  `discount` int(11) NOT NULL,
  `plan_type` varchar(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `schedule`
--

CREATE TABLE `schedule` (
  `schedule_id` varchar(255) NOT NULL,
  `data` longtext NOT NULL,
  `time` varchar(255) NOT NULL,
  `status` varchar(255) NOT NULL,
  `apikey` varchar(255) NOT NULL,
  `instance_id` varchar(50) NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `subscription`
--

CREATE TABLE `subscription` (
  `subID` varchar(20) NOT NULL,
  `planID` int(11) NOT NULL,
  `amount` int(11) NOT NULL,
  `apikey` varchar(50) NOT NULL,
  `paymentID` varchar(50) NOT NULL,
  `orderID` varchar(50) NOT NULL,
  `pay_date` date NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `support_agents`
--

CREATE TABLE `support_agents` (
  `apikey` varchar(255) NOT NULL,
  `name` varchar(225) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `category` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `support_ticket`
--

CREATE TABLE `support_ticket` (
  `ticket_id` varchar(50) NOT NULL,
  `category` varchar(50) NOT NULL,
  `user` varchar(50) NOT NULL,
  `t_subject` varchar(100) NOT NULL,
  `t_type` varchar(50) NOT NULL,
  `t_description` mediumtext NOT NULL,
  `t_document` text NOT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'open',
  `generation_time` timestamp NOT NULL DEFAULT current_timestamp(),
  `apikey` varchar(255) NOT NULL,
  `agent_email` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `template`
--

CREATE TABLE `template` (
  `temp_id` int(255) NOT NULL,
  `temp_name` varchar(255) NOT NULL,
  `temp_message` longtext NOT NULL,
  `userfields` int(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `ticket_reply`
--

CREATE TABLE `ticket_reply` (
  `index_no` int(255) NOT NULL,
  `identity` varchar(20) NOT NULL,
  `ticket_id` varchar(50) NOT NULL,
  `reply` mediumtext NOT NULL,
  `reply_time` timestamp NOT NULL DEFAULT current_timestamp(),
  `apikey` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `apikey` varchar(255) NOT NULL,
  `uname` varchar(255) NOT NULL,
  `email` varchar(30) NOT NULL,
  `password` varchar(255) NOT NULL,
  `phone` bigint(20) DEFAULT 0,
  `phoneverify` tinyint(1) NOT NULL DEFAULT 0,
  `country` varchar(255) DEFAULT NULL,
  `state` varchar(255) DEFAULT NULL,
  `city` varchar(255) DEFAULT NULL,
  `registrationDate` date NOT NULL,
  `image` varchar(300) DEFAULT NULL,
  `emailpasscode` varchar(50) DEFAULT NULL,
  `hostname` varchar(100) NOT NULL DEFAULT 'smtp.gmail.com',
  `port` bigint(20) NOT NULL DEFAULT 465
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Indexes for table `admin`
--
ALTER TABLE `admin`
  ADD PRIMARY KEY (`apikey`);

--
-- Indexes for table `bot`
--
ALTER TABLE `bot`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `channel`
--
ALTER TABLE `channel`
  ADD PRIMARY KEY (`channel_id`),
  ADD KEY `fk_apikey_channel` (`apikey`),
  ADD KEY `fk_iid_channel` (`instance_id`);

--
-- Indexes for table `company`
--
ALTER TABLE `company`
  ADD PRIMARY KEY (`company_id`);

--
-- Indexes for table `contact`
--
ALTER TABLE `contact`
  ADD PRIMARY KEY (`contact_id`),
  ADD KEY `fk_apikey_contact` (`apikey`),
  ADD KEY `fk_iid_contact` (`instance_id`);

--
-- Indexes for table `contact_channel`
--
ALTER TABLE `contact_channel`
  ADD PRIMARY KEY (`contact_id`,`channel_id`),
  ADD KEY `fk_apikey_contact_channel` (`apikey`),
  ADD KEY `fk_iid_contact_channel` (`instance_id`);

--
-- Indexes for table `cstm_template`
--
ALTER TABLE `cstm_template`
  ADD PRIMARY KEY (`cstm_id`),
  ADD KEY `fk_apikey_cstm_templet` (`apikey`);

--
-- Indexes for table `email`
--
ALTER TABLE `email`
  ADD PRIMARY KEY (`email_id`),
  ADD KEY `fk_iid_email` (`instance_id`),
  ADD KEY `fk_apikey_email` (`apikey`);

--
-- Indexes for table `instance`
--
ALTER TABLE `instance`
  ADD PRIMARY KEY (`instance_id`),
  ADD KEY `fk_apikey_instance` (`apikey`);

--
-- Indexes for table `log`
--
ALTER TABLE `log`
  ADD PRIMARY KEY (`logid`),
  ADD KEY `fk_apikey_log` (`apikey`),
  ADD KEY `fk_instance_id_log` (`instance_id`);

--
-- Indexes for table `message`
--
ALTER TABLE `message`
  ADD PRIMARY KEY (`msgid`),
  ADD KEY `c1` (`apikey`),
  ADD KEY `fk_iid_message` (`instance_id`);

--
-- Indexes for table `plans`
--
ALTER TABLE `plans`
  ADD PRIMARY KEY (`planid`);

--
-- Indexes for table `schedule`
--
ALTER TABLE `schedule`
  ADD PRIMARY KEY (`schedule_id`),
  ADD KEY `fk_iid_schedule` (`instance_id`),
  ADD KEY `fk_apikey_schedule` (`apikey`);

--
-- Indexes for table `subscription`
--
ALTER TABLE `subscription`
  ADD PRIMARY KEY (`subID`),
  ADD KEY `fk_planid` (`planID`),
  ADD KEY `fk_apikey_subscription` (`apikey`);

--
-- Indexes for table `support_agents`
--
ALTER TABLE `support_agents`
  ADD PRIMARY KEY (`apikey`);

--
-- Indexes for table `support_ticket`
--
ALTER TABLE `support_ticket`
  ADD PRIMARY KEY (`ticket_id`),
  ADD KEY `fk_apikey_support_ticket` (`apikey`);

--
-- Indexes for table `template`
--
ALTER TABLE `template`
  ADD PRIMARY KEY (`temp_id`);

--
-- Indexes for table `ticket_reply`
--
ALTER TABLE `ticket_reply`
  ADD PRIMARY KEY (`index_no`,`identity`,`ticket_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`apikey`);

--
-- Constraints for table `channel`
--
ALTER TABLE `channel`
  ADD CONSTRAINT `fk_apikey_channel` FOREIGN KEY (`apikey`) REFERENCES `users` (`apikey`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_iid_channel` FOREIGN KEY (`instance_id`) REFERENCES `instance` (`instance_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `contact`
--
ALTER TABLE `contact`
  ADD CONSTRAINT `fk_apikey_contact` FOREIGN KEY (`apikey`) REFERENCES `users` (`apikey`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_iid_contact` FOREIGN KEY (`instance_id`) REFERENCES `instance` (`instance_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `contact_channel`
--
ALTER TABLE `contact_channel`
  ADD CONSTRAINT `fk_apikey_contact_channel` FOREIGN KEY (`apikey`) REFERENCES `users` (`apikey`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_contact` FOREIGN KEY (`contact_id`) REFERENCES `contact` (`contact_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_iid_contact_channel` FOREIGN KEY (`instance_id`) REFERENCES `instance` (`instance_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `email`
--
ALTER TABLE `email`
  ADD CONSTRAINT `fk_apikey_email` FOREIGN KEY (`apikey`) REFERENCES `users` (`apikey`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_iid_email` FOREIGN KEY (`instance_id`) REFERENCES `instance` (`instance_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `instance`
--
ALTER TABLE `instance`
  ADD CONSTRAINT `fk_apikey_instance` FOREIGN KEY (`apikey`) REFERENCES `users` (`apikey`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `message`
--
ALTER TABLE `message`
  ADD CONSTRAINT `fk_apikey_message` FOREIGN KEY (`apikey`) REFERENCES `users` (`apikey`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_iid_message` FOREIGN KEY (`instance_id`) REFERENCES `instance` (`instance_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `subscription`
--
ALTER TABLE `subscription`
  ADD CONSTRAINT `fk_apikey_subscription` FOREIGN KEY (`apikey`) REFERENCES `users` (`apikey`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_planid` FOREIGN KEY (`planID`) REFERENCES `plans` (`planid`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `support_ticket`
--
ALTER TABLE `support_ticket`
  ADD CONSTRAINT `fk_apikey_support_ticket` FOREIGN KEY (`apikey`) REFERENCES `users` (`apikey`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

## 5. **Project Directory Setup**

After installing Node.js, follow these steps to set up the project:

- **Clone the repository:**
  - git clone [https://github.com/Srangwala02/ReachSync.git](https://github.com/Srangwala02/ReachSync.git)

- **Navigate to the project directory:**
  - cd ReachSync
     
- **Install dependencies:**
  - npm install

- **Start the Node.js application:**
  - npm run dev
    
Now, you're all set to run the project. Open your web browser and navigate to `http://localhost:8081` to view your project.
