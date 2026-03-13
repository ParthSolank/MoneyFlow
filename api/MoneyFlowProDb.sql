USE [master]
GO
/****** Object:  Database [MoneyFlowProDb]    Script Date: 08-03-2026 21:44:05 ******/
CREATE DATABASE [MoneyFlowProDb]
 CONTAINMENT = NONE
 ON  PRIMARY 
( NAME = N'MoneyFlowProDb', FILENAME = N'C:\Program Files\Microsoft SQL Server\MSSQL16.MSSQLSERVER\MSSQL\DATA\MoneyFlowProDb.mdf' , SIZE = 8192KB , MAXSIZE = UNLIMITED, FILEGROWTH = 65536KB )
 LOG ON 
( NAME = N'MoneyFlowProDb_log', FILENAME = N'C:\Program Files\Microsoft SQL Server\MSSQL16.MSSQLSERVER\MSSQL\DATA\MoneyFlowProDb_log.ldf' , SIZE = 8192KB , MAXSIZE = 2048GB , FILEGROWTH = 65536KB )
 WITH CATALOG_COLLATION = DATABASE_DEFAULT, LEDGER = OFF
GO
ALTER DATABASE [MoneyFlowProDb] SET COMPATIBILITY_LEVEL = 160
GO
IF (1 = FULLTEXTSERVICEPROPERTY('IsFullTextInstalled'))
begin
EXEC [MoneyFlowProDb].[dbo].[sp_fulltext_database] @action = 'enable'
end
GO
ALTER DATABASE [MoneyFlowProDb] SET ANSI_NULL_DEFAULT OFF 
GO
ALTER DATABASE [MoneyFlowProDb] SET ANSI_NULLS OFF 
GO
ALTER DATABASE [MoneyFlowProDb] SET ANSI_PADDING OFF 
GO
ALTER DATABASE [MoneyFlowProDb] SET ANSI_WARNINGS OFF 
GO
ALTER DATABASE [MoneyFlowProDb] SET ARITHABORT OFF 
GO
ALTER DATABASE [MoneyFlowProDb] SET AUTO_CLOSE OFF 
GO
ALTER DATABASE [MoneyFlowProDb] SET AUTO_SHRINK OFF 
GO
ALTER DATABASE [MoneyFlowProDb] SET AUTO_UPDATE_STATISTICS ON 
GO
ALTER DATABASE [MoneyFlowProDb] SET CURSOR_CLOSE_ON_COMMIT OFF 
GO
ALTER DATABASE [MoneyFlowProDb] SET CURSOR_DEFAULT  GLOBAL 
GO
ALTER DATABASE [MoneyFlowProDb] SET CONCAT_NULL_YIELDS_NULL OFF 
GO
ALTER DATABASE [MoneyFlowProDb] SET NUMERIC_ROUNDABORT OFF 
GO
ALTER DATABASE [MoneyFlowProDb] SET QUOTED_IDENTIFIER OFF 
GO
ALTER DATABASE [MoneyFlowProDb] SET RECURSIVE_TRIGGERS OFF 
GO
ALTER DATABASE [MoneyFlowProDb] SET  DISABLE_BROKER 
GO
ALTER DATABASE [MoneyFlowProDb] SET AUTO_UPDATE_STATISTICS_ASYNC OFF 
GO
ALTER DATABASE [MoneyFlowProDb] SET DATE_CORRELATION_OPTIMIZATION OFF 
GO
ALTER DATABASE [MoneyFlowProDb] SET TRUSTWORTHY OFF 
GO
ALTER DATABASE [MoneyFlowProDb] SET ALLOW_SNAPSHOT_ISOLATION OFF 
GO
ALTER DATABASE [MoneyFlowProDb] SET PARAMETERIZATION SIMPLE 
GO
ALTER DATABASE [MoneyFlowProDb] SET READ_COMMITTED_SNAPSHOT OFF 
GO
ALTER DATABASE [MoneyFlowProDb] SET HONOR_BROKER_PRIORITY OFF 
GO
ALTER DATABASE [MoneyFlowProDb] SET RECOVERY FULL 
GO
ALTER DATABASE [MoneyFlowProDb] SET  MULTI_USER 
GO
ALTER DATABASE [MoneyFlowProDb] SET PAGE_VERIFY CHECKSUM  
GO
ALTER DATABASE [MoneyFlowProDb] SET DB_CHAINING OFF 
GO
ALTER DATABASE [MoneyFlowProDb] SET FILESTREAM( NON_TRANSACTED_ACCESS = OFF ) 
GO
ALTER DATABASE [MoneyFlowProDb] SET TARGET_RECOVERY_TIME = 60 SECONDS 
GO
ALTER DATABASE [MoneyFlowProDb] SET DELAYED_DURABILITY = DISABLED 
GO
ALTER DATABASE [MoneyFlowProDb] SET ACCELERATED_DATABASE_RECOVERY = OFF  
GO
EXEC sys.sp_db_vardecimal_storage_format N'MoneyFlowProDb', N'ON'
GO
ALTER DATABASE [MoneyFlowProDb] SET QUERY_STORE = ON
GO
ALTER DATABASE [MoneyFlowProDb] SET QUERY_STORE (OPERATION_MODE = READ_WRITE, CLEANUP_POLICY = (STALE_QUERY_THRESHOLD_DAYS = 30), DATA_FLUSH_INTERVAL_SECONDS = 900, INTERVAL_LENGTH_MINUTES = 60, MAX_STORAGE_SIZE_MB = 1000, QUERY_CAPTURE_MODE = AUTO, SIZE_BASED_CLEANUP_MODE = AUTO, MAX_PLANS_PER_QUERY = 200, WAIT_STATS_CAPTURE_MODE = ON)
GO
USE [MoneyFlowProDb]
GO
/****** Object:  Table [dbo].[__EFMigrationsHistory]    Script Date: 08-03-2026 21:44:06 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[__EFMigrationsHistory](
	[MigrationId] [nvarchar](150) NOT NULL,
	[ProductVersion] [nvarchar](32) NOT NULL,
 CONSTRAINT [PK___EFMigrationsHistory] PRIMARY KEY CLUSTERED 
(
	[MigrationId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[AuditLogs]    Script Date: 08-03-2026 21:44:06 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[AuditLogs](
	[Id] [int] IDENTITY(1,1) NOT NULL,
	[UserId] [int] NOT NULL,
	[Username] [nvarchar](100) NOT NULL,
	[Action] [nvarchar](50) NOT NULL,
	[Module] [nvarchar](100) NOT NULL,
	[Details] [nvarchar](max) NOT NULL,
	[Timestamp] [datetime2](7) NOT NULL,
 CONSTRAINT [PK_AuditLogs] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Companies]    Script Date: 08-03-2026 21:44:06 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Companies](
	[Id] [int] IDENTITY(1,1) NOT NULL,
	[Name] [nvarchar](max) NOT NULL,
	[Description] [nvarchar](max) NOT NULL,
	[PanNumber] [nvarchar](max) NOT NULL,
	[GstNumber] [nvarchar](max) NOT NULL,
	[Address] [nvarchar](max) NOT NULL,
	[ContactEmail] [nvarchar](max) NOT NULL,
	[ContactPhone] [nvarchar](max) NOT NULL,
	[IsActive] [bit] NOT NULL,
	[CreatedAt] [datetime2](7) NOT NULL,
	[UpdatedAt] [datetime2](7) NOT NULL,
	[IsDeleted] [bit] NOT NULL,
 CONSTRAINT [PK_Companies] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[FinancialYears]    Script Date: 08-03-2026 21:44:06 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[FinancialYears](
	[Id] [int] IDENTITY(1,1) NOT NULL,
	[Name] [nvarchar](max) NOT NULL,
	[StartDate] [datetime2](7) NOT NULL,
	[EndDate] [datetime2](7) NOT NULL,
	[IsActive] [bit] NOT NULL,
	[Description] [nvarchar](max) NOT NULL,
	[CreatedAt] [datetime2](7) NOT NULL,
	[UpdatedAt] [datetime2](7) NOT NULL,
	[IsDeleted] [bit] NOT NULL,
 CONSTRAINT [PK_FinancialYears] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Ledgers]    Script Date: 08-03-2026 21:44:06 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Ledgers](
	[Id] [int] IDENTITY(1,1) NOT NULL,
	[Name] [nvarchar](200) NOT NULL,
	[Description] [nvarchar](500) NULL,
	[Balance] [decimal](18, 2) NOT NULL,
	[Icon] [nvarchar](100) NOT NULL,
	[AccountType] [nvarchar](20) NOT NULL,
	[CreatedAt] [datetime2](7) NOT NULL,
	[UpdatedAt] [datetime2](7) NOT NULL,
	[DeletedAt] [datetime2](7) NULL,
	[IsDeleted] [bit] NOT NULL,
 CONSTRAINT [PK_Ledgers] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Transactions]    Script Date: 08-03-2026 21:44:06 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Transactions](
	[Id] [int] IDENTITY(1,1) NOT NULL,
	[Description] [nvarchar](500) NOT NULL,
	[Amount] [decimal](18, 2) NOT NULL,
	[Date] [nvarchar](50) NOT NULL,
	[Type] [nvarchar](20) NOT NULL,
	[Category] [nvarchar](100) NOT NULL,
	[PaymentMethod] [nvarchar](20) NOT NULL,
	[LedgerId] [int] NULL,
	[CreatedAt] [datetime2](7) NOT NULL,
	[UpdatedAt] [datetime2](7) NOT NULL,
	[DeletedAt] [datetime2](7) NULL,
	[IsDeleted] [bit] NOT NULL,
 CONSTRAINT [PK_Transactions] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Users]    Script Date: 08-03-2026 21:44:06 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Users](
	[Id] [int] IDENTITY(1,1) NOT NULL,
	[Username] [nvarchar](100) NOT NULL,
	[Email] [nvarchar](150) NOT NULL,
	[PasswordHash] [nvarchar](max) NOT NULL,
	[Role] [nvarchar](max) NOT NULL,
	[Rights] [nvarchar](max) NOT NULL,
	[RefreshToken] [nvarchar](max) NULL,
	[RefreshTokenExpiryTime] [datetime2](7) NULL,
	[CreatedAt] [datetime2](7) NOT NULL,
	[UpdatedAt] [datetime2](7) NOT NULL,
 CONSTRAINT [PK_Users] PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
INSERT [dbo].[__EFMigrationsHistory] ([MigrationId], [ProductVersion]) VALUES (N'20260215110445_InitialCreate', N'9.0.0')
GO
INSERT [dbo].[__EFMigrationsHistory] ([MigrationId], [ProductVersion]) VALUES (N'20260215140908_AddUserAuth', N'8.0.11')
GO
INSERT [dbo].[__EFMigrationsHistory] ([MigrationId], [ProductVersion]) VALUES (N'20260226120454_AddAuditLogs', N'8.0.11')
GO
INSERT [dbo].[__EFMigrationsHistory] ([MigrationId], [ProductVersion]) VALUES (N'20260226123353_AddSoftDeletes', N'8.0.11')
GO
INSERT [dbo].[__EFMigrationsHistory] ([MigrationId], [ProductVersion]) VALUES (N'20260301092052_AddMasters', N'8.0.11')
GO
SET IDENTITY_INSERT [dbo].[AuditLogs] ON 
GO
INSERT [dbo].[AuditLogs] ([Id], [UserId], [Username], [Action], [Module], [Details], [Timestamp]) VALUES (1, 1, N'admin', N'UPDATE', N'Users', N'Updated user ''aaa'' (ID: 2) details.', CAST(N'2026-03-01T06:36:45.1038742' AS DateTime2))
GO
INSERT [dbo].[AuditLogs] ([Id], [UserId], [Username], [Action], [Module], [Details], [Timestamp]) VALUES (2, 1, N'admin', N'IMPORT', N'Transactions', N'Imported 18 transactions via File.', CAST(N'2026-03-01T06:39:13.3562148' AS DateTime2))
GO
INSERT [dbo].[AuditLogs] ([Id], [UserId], [Username], [Action], [Module], [Details], [Timestamp]) VALUES (3, 1, N'admin', N'IMPORT', N'Transactions', N'Imported 18 transactions via File.', CAST(N'2026-03-01T06:42:36.2550811' AS DateTime2))
GO
INSERT [dbo].[AuditLogs] ([Id], [UserId], [Username], [Action], [Module], [Details], [Timestamp]) VALUES (4, 1, N'admin', N'EXPORT', N'Transactions', N'Exported transaction ID 39 to PDF.', CAST(N'2026-03-01T06:44:39.6870228' AS DateTime2))
GO
INSERT [dbo].[AuditLogs] ([Id], [UserId], [Username], [Action], [Module], [Details], [Timestamp]) VALUES (5, 1, N'admin', N'IMPORT', N'Transactions', N'Imported 17 transactions via File.', CAST(N'2026-03-01T06:50:22.1263435' AS DateTime2))
GO
INSERT [dbo].[AuditLogs] ([Id], [UserId], [Username], [Action], [Module], [Details], [Timestamp]) VALUES (6, 1, N'admin', N'CREATE', N'Ledgers', N'Created ledger ''slice '' (Balance: 18).', CAST(N'2026-03-01T07:10:04.2296131' AS DateTime2))
GO
INSERT [dbo].[AuditLogs] ([Id], [UserId], [Username], [Action], [Module], [Details], [Timestamp]) VALUES (7, 1, N'admin', N'UPDATE', N'Ledgers', N'Updated ledger ''slice '' (ID: 3).', CAST(N'2026-03-01T07:11:35.5691604' AS DateTime2))
GO
INSERT [dbo].[AuditLogs] ([Id], [UserId], [Username], [Action], [Module], [Details], [Timestamp]) VALUES (8, 1, N'admin', N'DELETE', N'Ledgers', N'Deleted ledger ID 2.', CAST(N'2026-03-01T07:11:58.5817108' AS DateTime2))
GO
INSERT [dbo].[AuditLogs] ([Id], [UserId], [Username], [Action], [Module], [Details], [Timestamp]) VALUES (9, 1, N'admin', N'UPDATE', N'Ledgers', N'Updated ledger ''axis'' (ID: 1).', CAST(N'2026-03-01T07:15:39.8348117' AS DateTime2))
GO
INSERT [dbo].[AuditLogs] ([Id], [UserId], [Username], [Action], [Module], [Details], [Timestamp]) VALUES (10, 1, N'admin', N'UPDATE', N'Ledgers', N'Updated ledger ''au'' (ID: 1).', CAST(N'2026-03-01T07:19:40.1737386' AS DateTime2))
GO
INSERT [dbo].[AuditLogs] ([Id], [UserId], [Username], [Action], [Module], [Details], [Timestamp]) VALUES (11, 1, N'admin', N'CREATE', N'Ledgers', N'Created ledger ''HDFC BANK'' (Balance: 14863).', CAST(N'2026-03-01T07:35:29.2262603' AS DateTime2))
GO
INSERT [dbo].[AuditLogs] ([Id], [UserId], [Username], [Action], [Module], [Details], [Timestamp]) VALUES (12, 1, N'admin', N'CREATE', N'Ledgers', N'Created ledger ''slice '' (Balance: 18).', CAST(N'2026-03-01T07:35:51.1379802' AS DateTime2))
GO
INSERT [dbo].[AuditLogs] ([Id], [UserId], [Username], [Action], [Module], [Details], [Timestamp]) VALUES (13, 1, N'admin', N'IMPORT', N'Transactions', N'Imported 17 transactions via File.', CAST(N'2026-03-01T07:42:23.4687738' AS DateTime2))
GO
INSERT [dbo].[AuditLogs] ([Id], [UserId], [Username], [Action], [Module], [Details], [Timestamp]) VALUES (14, 1, N'admin', N'IMPORT', N'Transactions', N'Imported 17 transactions via File.', CAST(N'2026-03-01T07:42:48.7192908' AS DateTime2))
GO
INSERT [dbo].[AuditLogs] ([Id], [UserId], [Username], [Action], [Module], [Details], [Timestamp]) VALUES (15, 1, N'admin', N'IMPORT', N'Transactions', N'Imported 17 transactions via File.', CAST(N'2026-03-01T07:43:45.2552433' AS DateTime2))
GO
INSERT [dbo].[AuditLogs] ([Id], [UserId], [Username], [Action], [Module], [Details], [Timestamp]) VALUES (16, 1, N'admin', N'IMPORT', N'Transactions', N'Imported 17 transactions via File.', CAST(N'2026-03-01T07:48:34.2049040' AS DateTime2))
GO
INSERT [dbo].[AuditLogs] ([Id], [UserId], [Username], [Action], [Module], [Details], [Timestamp]) VALUES (17, 1, N'admin', N'CREATE', N'Transactions', N'Created transaction ''food'' (Amount: 18).', CAST(N'2026-03-01T08:01:12.6249348' AS DateTime2))
GO
INSERT [dbo].[AuditLogs] ([Id], [UserId], [Username], [Action], [Module], [Details], [Timestamp]) VALUES (18, 1, N'admin', N'UPDATE', N'Ledgers', N'Updated ledger ''slice '' (ID: 5).', CAST(N'2026-03-01T08:06:30.2331861' AS DateTime2))
GO
INSERT [dbo].[AuditLogs] ([Id], [UserId], [Username], [Action], [Module], [Details], [Timestamp]) VALUES (19, 1, N'admin', N'UPDATE', N'Transactions', N'Updated transaction ID 108.', CAST(N'2026-03-01T08:38:25.2850263' AS DateTime2))
GO
INSERT [dbo].[AuditLogs] ([Id], [UserId], [Username], [Action], [Module], [Details], [Timestamp]) VALUES (20, 1, N'admin', N'UPDATE', N'Transactions', N'Updated transaction ID 108.', CAST(N'2026-03-01T08:38:51.6408643' AS DateTime2))
GO
INSERT [dbo].[AuditLogs] ([Id], [UserId], [Username], [Action], [Module], [Details], [Timestamp]) VALUES (21, 1, N'admin', N'UPDATE', N'Transactions', N'Updated transaction ID 124.', CAST(N'2026-03-01T08:38:58.5564538' AS DateTime2))
GO
INSERT [dbo].[AuditLogs] ([Id], [UserId], [Username], [Action], [Module], [Details], [Timestamp]) VALUES (22, 1, N'admin', N'UPDATE', N'Transactions', N'Updated transaction ID 124.', CAST(N'2026-03-01T08:45:45.2643784' AS DateTime2))
GO
INSERT [dbo].[AuditLogs] ([Id], [UserId], [Username], [Action], [Module], [Details], [Timestamp]) VALUES (23, 1, N'admin', N'EXPORT', N'Transactions', N'Exported transaction ID 124 to PDF.', CAST(N'2026-03-01T09:07:36.6829958' AS DateTime2))
GO
INSERT [dbo].[AuditLogs] ([Id], [UserId], [Username], [Action], [Module], [Details], [Timestamp]) VALUES (24, 1, N'admin', N'UPDATE', N'Transactions', N'Updated transaction ID 124.', CAST(N'2026-03-01T09:07:52.4820246' AS DateTime2))
GO
INSERT [dbo].[AuditLogs] ([Id], [UserId], [Username], [Action], [Module], [Details], [Timestamp]) VALUES (25, 1, N'admin', N'DELETE', N'Transactions', N'Deleted transaction ID 124.', CAST(N'2026-03-01T09:07:58.8186905' AS DateTime2))
GO
INSERT [dbo].[AuditLogs] ([Id], [UserId], [Username], [Action], [Module], [Details], [Timestamp]) VALUES (26, 1, N'admin', N'EXPORT', N'Transactions', N'Exported transaction ID 123 to PDF.', CAST(N'2026-03-01T09:08:41.4972084' AS DateTime2))
GO
INSERT [dbo].[AuditLogs] ([Id], [UserId], [Username], [Action], [Module], [Details], [Timestamp]) VALUES (27, 1, N'admin', N'CREATE', N'Companies', N'Created company ''Kavan Inc''.', CAST(N'2026-03-01T09:52:33.6484915' AS DateTime2))
GO
INSERT [dbo].[AuditLogs] ([Id], [UserId], [Username], [Action], [Module], [Details], [Timestamp]) VALUES (28, 1, N'admin', N'UPDATE', N'Users', N'Updated user ''aaa'' (ID: 2) details.', CAST(N'2026-03-01T09:53:44.6637601' AS DateTime2))
GO
INSERT [dbo].[AuditLogs] ([Id], [UserId], [Username], [Action], [Module], [Details], [Timestamp]) VALUES (29, 1, N'admin', N'UPDATE', N'Users', N'Updated user ''aaa'' (ID: 2) details.', CAST(N'2026-03-01T09:54:36.4674258' AS DateTime2))
GO
INSERT [dbo].[AuditLogs] ([Id], [UserId], [Username], [Action], [Module], [Details], [Timestamp]) VALUES (30, 1, N'admin', N'UPDATE', N'Users', N'Updated user ''aaa'' (ID: 2) details.', CAST(N'2026-03-01T09:55:13.5438726' AS DateTime2))
GO
INSERT [dbo].[AuditLogs] ([Id], [UserId], [Username], [Action], [Module], [Details], [Timestamp]) VALUES (31, 1, N'admin', N'CREATE', N'FinancialYears', N'Created FY ''2026-27''.', CAST(N'2026-03-01T09:59:41.7108025' AS DateTime2))
GO
SET IDENTITY_INSERT [dbo].[AuditLogs] OFF
GO
SET IDENTITY_INSERT [dbo].[Companies] ON 
GO
INSERT [dbo].[Companies] ([Id], [Name], [Description], [PanNumber], [GstNumber], [Address], [ContactEmail], [ContactPhone], [IsActive], [CreatedAt], [UpdatedAt], [IsDeleted]) VALUES (1, N'Kavan Inc', N'Primary Company', N'', N'', N'', N'admin@demo.com', N'', 1, CAST(N'2026-03-01T09:52:33.5811267' AS DateTime2), CAST(N'2026-03-01T09:52:33.5811461' AS DateTime2), 0)
GO
SET IDENTITY_INSERT [dbo].[Companies] OFF
GO
SET IDENTITY_INSERT [dbo].[FinancialYears] ON 
GO
INSERT [dbo].[FinancialYears] ([Id], [Name], [StartDate], [EndDate], [IsActive], [Description], [CreatedAt], [UpdatedAt], [IsDeleted]) VALUES (1, N'2026-27', CAST(N'2026-04-01T00:00:00.0000000' AS DateTime2), CAST(N'2027-03-31T00:00:00.0000000' AS DateTime2), 1, N'', CAST(N'2026-03-01T09:59:41.6858046' AS DateTime2), CAST(N'2026-03-01T09:59:41.6858462' AS DateTime2), 0)
GO
SET IDENTITY_INSERT [dbo].[FinancialYears] OFF
GO
SET IDENTITY_INSERT [dbo].[Ledgers] ON 
GO
INSERT [dbo].[Ledgers] ([Id], [Name], [Description], [Balance], [Icon], [AccountType], [CreatedAt], [UpdatedAt], [DeletedAt], [IsDeleted]) VALUES (4, N'HDFC BANK', N'loan account', CAST(14863.00 AS Decimal(18, 2)), N'Wallet', N'bank', CAST(N'2026-03-01T07:35:29.0321274' AS DateTime2), CAST(N'2026-03-01T07:35:29.0321278' AS DateTime2), NULL, 0)
GO
INSERT [dbo].[Ledgers] ([Id], [Name], [Description], [Balance], [Icon], [AccountType], [CreatedAt], [UpdatedAt], [DeletedAt], [IsDeleted]) VALUES (5, N'slice ', N'spand account', CAST(500.00 AS Decimal(18, 2)), N'Wallet', N'bank', CAST(N'2026-03-01T07:35:51.1135874' AS DateTime2), CAST(N'2026-03-01T08:06:30.2273197' AS DateTime2), NULL, 0)
GO
SET IDENTITY_INSERT [dbo].[Ledgers] OFF
GO
SET IDENTITY_INSERT [dbo].[Transactions] ON 
GO
INSERT [dbo].[Transactions] ([Id], [Description], [Amount], [Date], [Type], [Category], [PaymentMethod], [LedgerId], [CreatedAt], [UpdatedAt], [DeletedAt], [IsDeleted]) VALUES (108, N'UPI-RAVIKUMAR RAJUBHAI R-8160429240@YBL-SBIN0000469-117989814774-SAKBHAJI', CAST(100.00 AS Decimal(18, 2)), N'2026-02-01', N'expense', N'misc', N'bank', 4, CAST(N'2026-03-01T07:48:34.1633326' AS DateTime2), CAST(N'2026-03-01T08:38:51.6374919' AS DateTime2), NULL, 0)
GO
INSERT [dbo].[Transactions] ([Id], [Description], [Amount], [Date], [Type], [Category], [PaymentMethod], [LedgerId], [CreatedAt], [UpdatedAt], [DeletedAt], [IsDeleted]) VALUES (109, N'UPI-BHARAT MANHARBHAI RA-RANABHARAT0604@OKICICI-BARB0DBSANA-117989916772-SAKBHAJI', CAST(50.00 AS Decimal(18, 2)), N'2026-02-01', N'expense', N'misc', N'bank', 4, CAST(N'2026-03-01T07:48:34.1712727' AS DateTime2), CAST(N'2026-03-01T07:48:34.1712728' AS DateTime2), NULL, 0)
GO
INSERT [dbo].[Transactions] ([Id], [Description], [Amount], [Date], [Type], [Category], [PaymentMethod], [LedgerId], [CreatedAt], [UpdatedAt], [DeletedAt], [IsDeleted]) VALUES (110, N'UPI-MR BHAVESHKUMAR MANH-Q989777409@YBL-YESB0YBLUPI-117990028087-SAKBHAJI', CAST(70.00 AS Decimal(18, 2)), N'2026-02-01', N'expense', N'misc', N'bank', 4, CAST(N'2026-03-01T07:48:34.1741095' AS DateTime2), CAST(N'2026-03-01T07:48:34.1741096' AS DateTime2), NULL, 0)
GO
INSERT [dbo].[Transactions] ([Id], [Description], [Amount], [Date], [Type], [Category], [PaymentMethod], [LedgerId], [CreatedAt], [UpdatedAt], [DeletedAt], [IsDeleted]) VALUES (111, N'UPI-RANA PRATIKBHAI-Q154807979@YBL-YESB0YBLUPI-117990306358-SAKBHAJI', CAST(50.00 AS Decimal(18, 2)), N'2026-02-01', N'expense', N'misc', N'bank', 4, CAST(N'2026-03-01T07:48:34.1763982' AS DateTime2), CAST(N'2026-03-01T07:48:34.1763983' AS DateTime2), NULL, 0)
GO
INSERT [dbo].[Transactions] ([Id], [Description], [Amount], [Date], [Type], [Category], [PaymentMethod], [LedgerId], [CreatedAt], [UpdatedAt], [DeletedAt], [IsDeleted]) VALUES (112, N'UPI-MR VADODIYA  SOHIL R-Q350831113@YBL-YESB0YBLUPI-117990703273-ZIMRI MASALO', CAST(100.00 AS Decimal(18, 2)), N'2026-02-01', N'expense', N'misc', N'bank', 4, CAST(N'2026-03-01T07:48:34.1785528' AS DateTime2), CAST(N'2026-03-01T07:48:34.1785529' AS DateTime2), NULL, 0)
GO
INSERT [dbo].[Transactions] ([Id], [Description], [Amount], [Date], [Type], [Category], [PaymentMethod], [LedgerId], [CreatedAt], [UpdatedAt], [DeletedAt], [IsDeleted]) VALUES (113, N'NEFT CR-SBIN0000813-EMPLOYEE PROVIDENT FUND ORGANIZATIO-SOLANKI PARTH JATINBHAI-SBIN426033914970', CAST(3080.00 AS Decimal(18, 2)), N'2026-02-02', N'income', N'misc', N'bank', 4, CAST(N'2026-03-01T07:48:34.1809762' AS DateTime2), CAST(N'2026-03-01T07:48:34.1809762' AS DateTime2), NULL, 0)
GO
INSERT [dbo].[Transactions] ([Id], [Description], [Amount], [Date], [Type], [Category], [PaymentMethod], [LedgerId], [CreatedAt], [UpdatedAt], [DeletedAt], [IsDeleted]) VALUES (114, N'EMI 465863134 CHQ S4658631340101 0226465863134', CAST(2303.00 AS Decimal(18, 2)), N'2026-02-05', N'expense', N'misc', N'bank', 4, CAST(N'2026-03-01T07:48:34.1833491' AS DateTime2), CAST(N'2026-03-01T07:48:34.1833491' AS DateTime2), NULL, 0)
GO
INSERT [dbo].[Transactions] ([Id], [Description], [Amount], [Date], [Type], [Category], [PaymentMethod], [LedgerId], [CreatedAt], [UpdatedAt], [DeletedAt], [IsDeleted]) VALUES (115, N'EMI 467183033 CHQ S4671830330031 0226467183033', CAST(3426.00 AS Decimal(18, 2)), N'2026-02-05', N'expense', N'misc', N'bank', 4, CAST(N'2026-03-01T07:48:34.1857758' AS DateTime2), CAST(N'2026-03-01T07:48:34.1857759' AS DateTime2), NULL, 0)
GO
INSERT [dbo].[Transactions] ([Id], [Description], [Amount], [Date], [Type], [Category], [PaymentMethod], [LedgerId], [CreatedAt], [UpdatedAt], [DeletedAt], [IsDeleted]) VALUES (116, N'UPI-THE EKLINGJI PARISAR-GETEPAY.TADCBLQR524345@ICICI-ICIC0DC0099-118223654159-FEB 2026 MAINTENAN', CAST(1500.00 AS Decimal(18, 2)), N'2026-02-05', N'expense', N'misc', N'bank', 4, CAST(N'2026-03-01T07:48:34.1876273' AS DateTime2), CAST(N'2026-03-01T07:48:34.1876274' AS DateTime2), NULL, 0)
GO
INSERT [dbo].[Transactions] ([Id], [Description], [Amount], [Date], [Type], [Category], [PaymentMethod], [LedgerId], [CreatedAt], [UpdatedAt], [DeletedAt], [IsDeleted]) VALUES (117, N'UPI-SOLANKI PARTH JATINB-SOLANKIPARTH116-3@OKAXIS-KKBK0002561-603921517910-CC BIL PAYMANT', CAST(3300.00 AS Decimal(18, 2)), N'2026-02-08', N'income', N'misc', N'bank', 4, CAST(N'2026-03-01T07:48:34.1897726' AS DateTime2), CAST(N'2026-03-01T07:48:34.1897727' AS DateTime2), NULL, 0)
GO
INSERT [dbo].[Transactions] ([Id], [Description], [Amount], [Date], [Type], [Category], [PaymentMethod], [LedgerId], [CreatedAt], [UpdatedAt], [DeletedAt], [IsDeleted]) VALUES (118, N'UPI-HDFC BANK DIGITAL CR-HDFCBANKDIGITALCREDI.75089219@HDFCBANK-HDFC0MERUPI-093427167819-REMARK', CAST(3832.00 AS Decimal(18, 2)), N'2026-02-08', N'expense', N'misc', N'bank', 4, CAST(N'2026-03-01T07:48:34.1922214' AS DateTime2), CAST(N'2026-03-01T07:48:34.1922216' AS DateTime2), NULL, 0)
GO
INSERT [dbo].[Transactions] ([Id], [Description], [Amount], [Date], [Type], [Category], [PaymentMethod], [LedgerId], [CreatedAt], [UpdatedAt], [DeletedAt], [IsDeleted]) VALUES (119, N'UPI-SOLANKI PARTH JATINB-SOLANKIPARTH116-6@OKICICI-AUBL0002535-604090795131-BALANCE MAINTEN', CAST(1000.00 AS Decimal(18, 2)), N'2026-02-09', N'income', N'misc', N'bank', 4, CAST(N'2026-03-01T07:48:34.1940020' AS DateTime2), CAST(N'2026-03-01T07:48:34.1940020' AS DateTime2), NULL, 0)
GO
INSERT [dbo].[Transactions] ([Id], [Description], [Amount], [Date], [Type], [Category], [PaymentMethod], [LedgerId], [CreatedAt], [UpdatedAt], [DeletedAt], [IsDeleted]) VALUES (120, N'UPI-SOLANKI KAVAN JATINB-SOLANKIKAVAN134-2@OKSBI-UTIB0001426-604058797301-UPI', CAST(4000.00 AS Decimal(18, 2)), N'2026-02-09', N'income', N'misc', N'bank', 4, CAST(N'2026-03-01T07:48:34.1958258' AS DateTime2), CAST(N'2026-03-01T07:48:34.1958258' AS DateTime2), NULL, 0)
GO
INSERT [dbo].[Transactions] ([Id], [Description], [Amount], [Date], [Type], [Category], [PaymentMethod], [LedgerId], [CreatedAt], [UpdatedAt], [DeletedAt], [IsDeleted]) VALUES (121, N'UPI-CHAUHAN AJAYBHAI GHA-8849698260@YBL-KKBK0002575-231058671954-RAPIDO', CAST(112.00 AS Decimal(18, 2)), N'2026-02-12', N'expense', N'misc', N'bank', 4, CAST(N'2026-03-01T07:48:34.1972210' AS DateTime2), CAST(N'2026-03-01T07:48:34.1972210' AS DateTime2), NULL, 0)
GO
INSERT [dbo].[Transactions] ([Id], [Description], [Amount], [Date], [Type], [Category], [PaymentMethod], [LedgerId], [CreatedAt], [UpdatedAt], [DeletedAt], [IsDeleted]) VALUES (122, N'UPI-HDFC BANK DIGITAL CR-HDFCBANKDIGITALCREDI.75089219@HDFCBANK-HDFC0MERUPI-187738804886-REMARK', CAST(4000.00 AS Decimal(18, 2)), N'2026-02-15', N'expense', N'misc', N'bank', 4, CAST(N'2026-03-01T07:48:34.1996870' AS DateTime2), CAST(N'2026-03-01T07:48:34.1996871' AS DateTime2), NULL, 0)
GO
INSERT [dbo].[Transactions] ([Id], [Description], [Amount], [Date], [Type], [Category], [PaymentMethod], [LedgerId], [CreatedAt], [UpdatedAt], [DeletedAt], [IsDeleted]) VALUES (123, N'UPI-PARTH JATINBHAI SOLA-SOLANKIPARTH116-5@OKHDFCBANK-NESF0000333-118939965817-ALL FOR 17 EMI AND', CAST(3350.94 AS Decimal(18, 2)), N'2026-02-21', N'income', N'misc', N'bank', 4, CAST(N'2026-03-01T07:48:34.2014572' AS DateTime2), CAST(N'2026-03-01T07:48:34.2014572' AS DateTime2), NULL, 0)
GO
INSERT [dbo].[Transactions] ([Id], [Description], [Amount], [Date], [Type], [Category], [PaymentMethod], [LedgerId], [CreatedAt], [UpdatedAt], [DeletedAt], [IsDeleted]) VALUES (124, N'UPI-HDFC BANK DIGITAL CR-HDFCBANKDIGITALCREDI.75089219@HDFCBANK-HDFC0MERUPI-642621564800-REMARK', CAST(624.00 AS Decimal(18, 2)), N'2026-02-21', N'expense', N'travel', N'bank', 4, CAST(N'2026-03-01T07:48:34.2033367' AS DateTime2), CAST(N'2026-03-01T09:07:52.4768806' AS DateTime2), CAST(N'2026-03-01T09:07:58.7961650' AS DateTime2), 1)
GO
INSERT [dbo].[Transactions] ([Id], [Description], [Amount], [Date], [Type], [Category], [PaymentMethod], [LedgerId], [CreatedAt], [UpdatedAt], [DeletedAt], [IsDeleted]) VALUES (125, N'food', CAST(18.00 AS Decimal(18, 2)), N'2026-03-01', N'expense', N'food', N'bank', 5, CAST(N'2026-03-01T08:01:12.5952113' AS DateTime2), CAST(N'2026-03-01T08:01:12.5952117' AS DateTime2), NULL, 0)
GO
SET IDENTITY_INSERT [dbo].[Transactions] OFF
GO
SET IDENTITY_INSERT [dbo].[Users] ON 
GO
INSERT [dbo].[Users] ([Id], [Username], [Email], [PasswordHash], [Role], [Rights], [RefreshToken], [RefreshTokenExpiryTime], [CreatedAt], [UpdatedAt]) VALUES (1, N'admin', N'admin@demo.com', N'$2a$11$Rq.QhylF8/eIRrr74HOnSO.EJpyf0O3ZXFBcWQVEPMcudS5dYJHU6', N'Admin', N'["VIEW_REPORTS","CORE_TRANSACTIONS_VIEW","CORE_TRANSACTIONS_CREATE","CORE_TRANSACTIONS_EDIT","CORE_TRANSACTIONS_DELETE","CORE_LEDGERS_VIEW","CORE_LEDGERS_CREATE","CORE_LEDGERS_EDIT","CORE_LEDGERS_DELETE"]', N'ziF7BB+8AmjzWansc2JYdU7qEpWMSSPCpaagEIccUTQ=', CAST(N'2026-03-08T09:59:41.6646183' AS DateTime2), CAST(N'2026-02-15T14:14:10.1388543' AS DateTime2), CAST(N'2026-02-15T14:14:10.1388665' AS DateTime2))
GO
INSERT [dbo].[Users] ([Id], [Username], [Email], [PasswordHash], [Role], [Rights], [RefreshToken], [RefreshTokenExpiryTime], [CreatedAt], [UpdatedAt]) VALUES (2, N'aaa', N'aaa@gmail.com', N'$2a$11$LNjd9t.bz/g0ArQcYTJOJudv5B7Od.0Y/yo5AmS2l1xpYYOkKH6T.', N'Standard', N'["CORE_DASHBOARD_VIEW","CORE_DASHBOARD_CREATE","CORE_DASHBOARD_EDIT","CORE_DASHBOARD_DELETE","CORE_TRANSACTIONS_VIEW","CORE_LEDGERS_VIEW"]', N'zbrGkMBVC8dadMhmZibETAYIZfP0AiXBYJsa1HyBUUI=', CAST(N'2026-03-08T09:55:25.0599908' AS DateTime2), CAST(N'2026-02-15T14:29:11.5124235' AS DateTime2), CAST(N'2026-03-01T09:55:13.5381637' AS DateTime2))
GO
SET IDENTITY_INSERT [dbo].[Users] OFF
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [IX_Ledgers_AccountType]    Script Date: 08-03-2026 21:44:06 ******/
CREATE NONCLUSTERED INDEX [IX_Ledgers_AccountType] ON [dbo].[Ledgers]
(
	[AccountType] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [IX_Transactions_Category]    Script Date: 08-03-2026 21:44:06 ******/
CREATE NONCLUSTERED INDEX [IX_Transactions_Category] ON [dbo].[Transactions]
(
	[Category] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [IX_Transactions_Date]    Script Date: 08-03-2026 21:44:06 ******/
CREATE NONCLUSTERED INDEX [IX_Transactions_Date] ON [dbo].[Transactions]
(
	[Date] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
/****** Object:  Index [IX_Transactions_LedgerId]    Script Date: 08-03-2026 21:44:06 ******/
CREATE NONCLUSTERED INDEX [IX_Transactions_LedgerId] ON [dbo].[Transactions]
(
	[LedgerId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [IX_Transactions_PaymentMethod]    Script Date: 08-03-2026 21:44:06 ******/
CREATE NONCLUSTERED INDEX [IX_Transactions_PaymentMethod] ON [dbo].[Transactions]
(
	[PaymentMethod] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [IX_Transactions_Type]    Script Date: 08-03-2026 21:44:06 ******/
CREATE NONCLUSTERED INDEX [IX_Transactions_Type] ON [dbo].[Transactions]
(
	[Type] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [IX_Users_Email]    Script Date: 08-03-2026 21:44:06 ******/
CREATE UNIQUE NONCLUSTERED INDEX [IX_Users_Email] ON [dbo].[Users]
(
	[Email] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [IX_Users_Username]    Script Date: 08-03-2026 21:44:06 ******/
CREATE UNIQUE NONCLUSTERED INDEX [IX_Users_Username] ON [dbo].[Users]
(
	[Username] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
ALTER TABLE [dbo].[Ledgers] ADD  DEFAULT (getutcdate()) FOR [CreatedAt]
GO
ALTER TABLE [dbo].[Ledgers] ADD  DEFAULT (getutcdate()) FOR [UpdatedAt]
GO
ALTER TABLE [dbo].[Ledgers] ADD  DEFAULT (CONVERT([bit],(0))) FOR [IsDeleted]
GO
ALTER TABLE [dbo].[Transactions] ADD  DEFAULT (getutcdate()) FOR [CreatedAt]
GO
ALTER TABLE [dbo].[Transactions] ADD  DEFAULT (getutcdate()) FOR [UpdatedAt]
GO
ALTER TABLE [dbo].[Transactions] ADD  DEFAULT (CONVERT([bit],(0))) FOR [IsDeleted]
GO
ALTER TABLE [dbo].[Transactions]  WITH CHECK ADD  CONSTRAINT [FK_Transactions_Ledgers_LedgerId] FOREIGN KEY([LedgerId])
REFERENCES [dbo].[Ledgers] ([Id])
ON DELETE SET NULL
GO
ALTER TABLE [dbo].[Transactions] CHECK CONSTRAINT [FK_Transactions_Ledgers_LedgerId]
GO
USE [master]
GO
ALTER DATABASE [MoneyFlowProDb] SET  READ_WRITE 
GO
