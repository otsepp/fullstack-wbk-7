import React from 'react'
import Blog from './components/Blog'
import Notification from './components/Notification'
import NewBlogForm from './components/NewBlogForm'
import Togglable from './components/Togglable'
import blogService from './services/blogs'
import loginService from './services/login'
import usersService from './services/users'
import { BrowserRouter as Router, Route, Link } from 'react-router-dom'

class App extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
			username: '',
			password: '',
			user: null,
			
			blogs: [],

			title: '',
			author: '',
			url: '',
			
			message: null
    }
  }

  componentDidMount() {
    blogService.getAll().then(blogs => {
			blogs.sort((a, b) => b.likes - a.likes)
      this.setState({ blogs })
		})
		const loggedUserJSON = window.localStorage.getItem('loggedUser')
		if (loggedUserJSON) {
			const user = JSON.parse(loggedUserJSON)
			this.setState({user})
			blogService.setToken(user.token)
		}
  }
	
	handleFieldChange = (event) => {
		this.setState({ [event.target.name]: event.target.value })
	}
	
	setMessage = (message) => {
		this.setState({
      message: message,
    })
    setTimeout(() => {
      this.setState({ message: null })
    }, 5000)
	}
	
	login = async (event) => {
		event.preventDefault()
		try {
			const user = await loginService.login({
				id: this.state._id,
				username: this.state.username,
				password: this.state.password
			})
			window.localStorage.setItem('loggedUser', JSON.stringify(user))
			blogService.setToken(user.token)
			this.setState({username: '', password: '', user})
			
		} catch (exception) {
			this.setMessage('käyttäjätunnus tai salasana virheellinen')
		}
	}
	
	logout = (event) => {
		window.localStorage.removeItem('loggedUser')
		this.setState({ user: null })
	}
	
	addNewBlog = (event) => {
		event.preventDefault()
		const blogObject = {
			title: this.state.title,
			author: this.state.author,
			url: this.state.url
		}
		blogService
			.create(blogObject)
			.then(newBlog => {
				this.setMessage(`New blog '${blogObject.title}' by ${blogObject.author} added`)
				
				this.setState({
					blogs: this.state.blogs.concat(newBlog),
					title: '',
					author: '',
					url: '',
				})
			})
		
	}
	
	likeBlog = async (blog) => {
		try {
			const updatedBlog = {
				title: blog.title,
				author: blog.author,
				url: blog.url,
				likes: blog.likes + 1
			}
			const response = await blogService.update(blog.id, updatedBlog)
			
			this.setState({
				blogs: this.state.blogs.map(b => b.id !== blog.id ? b : response)
			})
			
		} catch (exception) {
			this.setMessage(exception)
		}
	}
	
	removeBlog = async (blog) => {
		try {
			const response = await blogService.remove(blog.id)
			
			console.log(response)
			
			this.setState({
				blogs: this.state.blogs.filter(b => b._id !== blog.id)
			})
			
			console.log(this.state.blogs)
			
		} catch (exception) {
			this.setMessage(exception)
		}
	}
	
  render() {
		if (this.state.user == null) {
			return (
				<div className="content-not-logged">
					<h2>Log in to application</h2>
				 
				 <Notification message={this.state.message}/>
				 
					<form className="loginForm" onSubmit={this.login}>
						<div>username 
							<input 
								type="text"
								name="username" 
								value={this.state.username} 
								onChange={this.handleFieldChange}
							/>
						</div>
						<div>password 
							<input 
								type="text" 
								name="password" 
								value={this.state.password} 
								onChange={this.handleFieldChange}
							/>
						</div>
						<button type="submit">log in</button>
					</form>
					
				</div>
			)
		}
		
		return (
			<Router>
				<div>
					<Route exact path="/" render={() =>
						<Home 
							message={this.state.message} user={this.state.user} logout={this.logout} addNewBlog={this.addNewBlog}
							handleFieldChange={this.handleFieldChange} title={this.state.title} author={this.state.author} url={this.state.url}
							blogs={this.state.blogs} likeBlog={this.likeBlog} removeBlog={this.removeBlog}
						/>
					}/>
				</div>
			</Router>
    )
  }
}

const Home = ({message, user, logout, addNewBlog, handleFieldChange, title, author, url, blogs, likeBlog, removeBlog}) => {
	return (
		<div className="content-logged">
			<h2>blogs</h2>
			<Notification message={message}/>
			{user.name} logged in
			<button onClick={logout}>logout</button>
			<h3>create new</h3>
			<Togglable buttonLabel="open">
				<NewBlogForm 
					handleSubmit={addNewBlog} 
					handleFieldChange={handleFieldChange}
					title={title}
					author={author}
					url={url}
				/>
			</Togglable>
			{blogs.map(blog =>
				<Blog 
					key={blog.id}
					blog={blog} 
					blogLikeHandler={likeBlog} 
					removeBlogHandler={removeBlog}
					loggedUser={user}
				/>
			)}
		</div>
	)
}

export default App;
