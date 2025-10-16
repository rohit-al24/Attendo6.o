"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var supabase_js_1 = require("@supabase/supabase-js");
var uuid_1 = require("uuid");
var fs_1 = require("fs");
var path_1 = require("path");
var sync_1 = require("csv-parse/lib/sync");
// Set your Supabase credentials here
var SUPABASE_URL = process.env.SUPABASE_URL || '<YOUR_SUPABASE_URL>';
var SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '<YOUR_SERVICE_ROLE_KEY>';
var supabase = (0, supabase_js_1.createClient)(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
// Path to your CSV file
var csvPath = path_1.default.resolve(__dirname, '../../c:/Users/rohit_irz3fyx/AppData/Local/Packages/5319275A.WhatsAppDesktop_cv1g1gvanyjgm/TempState/BF5A1D9043100645B2067FA70D7A1EA6/Dataset (1).csv');
function parseCSV(filePath) {
    var fileContent = fs_1.default.readFileSync(filePath, 'utf8');
    return (0, sync_1.default)(fileContent, {
        columns: true,
        skip_empty_lines: true,
    });
}
function setupStudents() {
    return __awaiter(this, void 0, void 0, function () {
        var students, count, _i, students_1, student, uuid;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    students = parseCSV(csvPath);
                    count = 0;
                    _i = 0, students_1 = students;
                    _a.label = 1;
                case 1:
                    if (!(_i < students_1.length)) return [3 /*break*/, 6];
                    student = students_1[_i];
                    uuid = (0, uuid_1.v4)();
                    // Insert into profiles
                    return [4 /*yield*/, supabase.from('profiles').insert({
                            id: uuid,
                            email: student.email,
                            full_name: student.name,
                        })];
                case 2:
                    // Insert into profiles
                    _a.sent();
                    // Insert into students
                    return [4 /*yield*/, supabase.from('students').insert({
                            id: uuid,
                            full_name: student.name,
                            roll_number: student.roll_number,
                            user_id: uuid,
                        })];
                case 3:
                    // Insert into students
                    _a.sent();
                    // Insert into user_roles
                    return [4 /*yield*/, supabase.from('user_roles').insert({
                            user_id: uuid,
                            role: 'student',
                        })];
                case 4:
                    // Insert into user_roles
                    _a.sent();
                    count++;
                    _a.label = 5;
                case 5:
                    _i++;
                    return [3 /*break*/, 1];
                case 6:
                    console.log("Inserted ".concat(count, " students into Supabase."));
                    return [2 /*return*/];
            }
        });
    });
}
setupStudents();
