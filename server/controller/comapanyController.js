import Company from "../models/Company.js";
import bcrypt from "bcrypt";
import { v2 as cloudinary } from "cloudinary";
import generateToken from "../utils/generateToken.js";
import Job from "../models/Job.js";
import JobApplication from "../models/JobApplication.js";
// Register a new Company
export const registerCompany = async (req, res) => {};

// Company Login
export const loginCompany = async (req, res) => {};

// Get company data
export const getCompanyData = async (req, res) => {};

// Post a new Job
export const postJob = async (req, res) => {};
// Get Company Job Applicants
export const getCompanyJobApplicants = async (req, res) => {};

// Get Company  Posted Jobs
export const getCompanyPostedJobs = async (req, res) => {};

// Change Job Application Status
export const ChangeJobApplicationStatus = async (req, res) => {};

// Change Job Visiblity
export const changeVisiblity = async (req, res) => {};
